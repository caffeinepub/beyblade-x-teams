import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Migration "migration";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // User Profile Management
  public type UserProfile = {
    name : Text;
    profilePicture : ?Storage.ExternalBlob;
    aboutMe : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type Image = {
    filename : Text;
    contentType : Text;
    bytes : [Nat8];
  };

  public type PDFDocument = {
    filename : Text;
    content : [Nat8];
  };

  // Enhanced video type to track uploader for authorization
  public type TeamVideo = {
    videoId : Text;
    video : Storage.ExternalBlob;
    uploader : Principal;
  };

  public type Team = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<PDFDocument>;
    icon : ?Image;
    videos : List.List<TeamVideo>;
  };

  public type TeamDTO = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : [Principal];
    joinRequests : [Principal];
    files : [PDFDocument];
    icon : ?Image;
    videos : [Storage.ExternalBlob];
  };

  public type Mail = {
    id : Nat;
    recipient : Principal;
    sender : Principal;
    mailType : MailType;
    content : MailContent;
    isRead : Bool;
  };

  public type MailType = {
    #joinRequest;
    #notification;
  };

  public type MailContent = {
    #joinRequest : {
      teamId : Nat;
      requester : Principal;
      message : Text;
    };
    #notification : Text;
  };

  var nextMailId = 1;
  let mailboxes = Map.empty<Principal, List.List<Mail>>();
  var nextTeamId = 1;
  let maxTeamSize = 3;
  let maxFileSize = 10_000_000; // 10 MB

  // Track all active team memberships. Each unique member is stored only once.
  let teamMembers = Map.empty<Principal, Nat>();
  let teams = Map.empty<Nat, Team>();

  func isTeamMember(team : Team, principal : Principal) : Bool {
    team.members.contains(principal);
  };

  func isTeamLeaderOrMember(team : Team, principal : Principal) : Bool {
    team.leader == principal or team.members.contains(principal);
  };

  func isJoinRequested(team : Team, principal : Principal) : Bool {
    for (request in team.joinRequests.values()) {
      if (request == principal) {
        return true;
      };
    };
    false;
  };

  // Battle requests
  public type BattleRequestStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  public type BattleRequest = {
    id : Nat;
    requestingTeam : Nat;
    targetTeam : Nat;
    proposedDate : Text;
    status : BattleRequestStatus;
  };

  var nextBattleRequestId = 1;
  let battleRequests = Map.empty<Nat, BattleRequest>();

  func teamToDTO(team : Team) : TeamDTO {
    {
      id = team.id;
      leader = team.leader;
      name = team.name;
      members = team.members.toArray();
      joinRequests = team.joinRequests.toArray();
      files = team.files.toArray();
      icon = team.icon;
      videos = team.videos.toArray().map(func(tv : TeamVideo) : Storage.ExternalBlob { tv.video });
    };
  };

  func checkTeamExists(teamId : Nat) : Team {
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?team) { team };
    };
  };

  // Check if a Principal is a current active member of any team
  func checkTeamMemberExists(_principal : Principal) {
    switch (teamMembers.get(_principal)) {
      case (null) { return };
      case (_) { Runtime.trap("User is already a member of a team") };
    };
  };

  // Helper function to get NOT_FOUND status code
  func getNotFoundStatus() : Nat {
    404;
  };

  public shared ({ caller }) func createTeam(name : Text, initialMembers : [Principal]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create teams");
    };
    if (initialMembers.size() > maxTeamSize) { Runtime.trap("Team must have at most " # maxTeamSize.toText() # " members") };

    checkTeamMemberExists(caller);

    // Check if any member is already in a team. If so, abort.
    let members = Set.empty<Principal>();

    // CRITICAL FIX: Add the team creator (leader) to the members set
    members.add(caller);

    for (i in Nat.range(0, initialMembers.size())) {
      let principal = initialMembers[i];
      checkTeamMemberExists(principal);
      members.add(principal);
    };

    let teamId = nextTeamId;
    let newTeam = {
      id = teamId;
      leader = caller;
      name;
      members;
      joinRequests = List.empty<Principal>();
      files = List.empty<PDFDocument>();
      icon = null;
      videos = List.empty<TeamVideo>();
    };
    teams.add(teamId, newTeam);
    nextTeamId += 1;

    // Add the leader to team members tracking
    teamMembers.add(caller, teamId);

    // Add all new members to the set of team members
    for (member in members.toArray().values()) {
      if (member != caller) {
        teamMembers.add(member, teamId);
      };
    };

    teamId;
  };

  public query ({ caller }) func getTeam(teamId : Nat) : async TeamDTO {
    teamToDTO(checkTeamExists(teamId));
  };

  public query ({ caller }) func listTeams() : async [TeamDTO] {
    teams.values().toArray().map(func(x) { teamToDTO(x) });
  };

  public shared ({ caller }) func requestJoinTeam(teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request to join teams");
    };

    checkTeamMemberExists(caller);

    let team = checkTeamExists(teamId);

    if (team.members.contains(caller)) { Runtime.trap("User is already a member of this team") };

    // Check if already requested
    for (existingRequest in team.joinRequests.values()) {
      if (existingRequest == caller) { Runtime.trap("User already requested to join") };
    };

    // Add to team's join requests list
    team.joinRequests.add(caller);

    let mail = {
      id = nextMailId;
      recipient = team.leader;
      sender = caller;
      mailType = #joinRequest;
      content = #joinRequest({
        teamId;
        requester = caller;
        message = "User wants to join team";
      });
      isRead = false;
    };
    nextMailId += 1;

    // Add to mailbox for team leader using mailbox map
    let currentMailbox = switch (mailboxes.get(team.leader)) {
      case (null) { List.empty<Mail>() };
      case (?mails) { mails };
    };
    currentMailbox.add(mail);
    mailboxes.add(team.leader, currentMailbox);
  };

  public shared ({ caller }) func approveJoinRequests(teamId : Nat, approvals : [Principal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can approve join requests");
    };
    let team = checkTeamExists(teamId);
    if (caller != team.leader) { Runtime.trap("Only team leader can approve join requests") };

    let currentSize = team.members.size();
    let totalAfterApproval = currentSize + approvals.size();
    if (totalAfterApproval > maxTeamSize) { Runtime.trap("Approving members would exceed team size limit") };

    var i = 0;
    let numApprovals = approvals.size();
    while (i < numApprovals) {
      let approved = approvals[i];
      var wasRequested = false;

      // Verify the user actually requested to join
      for (request in team.joinRequests.values()) {
        if (request == approved) {
          wasRequested := true;
        };
      };

      if (not wasRequested) { Runtime.trap("User not found in pending join requests") };

      checkTeamMemberExists(approved);

      // Remove from join requests
      let filteredRequests = team.joinRequests.filter(func(request) {
        request != approved;
      });

      // Add to members
      team.members.add(approved);

      // Add membership to tracking map
      teamMembers.add(approved, teamId);

      let updatedTeam = {
        team with
        joinRequests = filteredRequests;
      };
      teams.add(teamId, updatedTeam);

      i += 1;
    };
  };

  public shared ({ caller }) func denyJoinRequests(teamId : Nat, denials : [Principal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deny join requests");
    };
    let team = checkTeamExists(teamId);
    if (caller != team.leader) { Runtime.trap("Only team leader can deny join requests") };

    var i = 0;
    let numDenials = denials.size();
    while (i < numDenials) {
      let denied = denials[i];
      var wasRequested = false;

      // Verify the user actually requested to join
      for (request in team.joinRequests.values()) {
        if (request == denied) {
          wasRequested := true;
        };
      };

      if (not wasRequested) { Runtime.trap("User not found in pending join requests") };

      // Remove from join requests
      let filteredRequests = team.joinRequests.filter(func(request) {
        request != denied;
      });

      let updatedTeam = {
        team with
        joinRequests = filteredRequests;
      };
      teams.add(teamId, updatedTeam);

      i += 1;
    };
  };

  public shared ({ caller }) func disbandTeam(teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can disband teams");
    };
    let team = checkTeamExists(teamId);
    if (caller != team.leader) { Runtime.trap("Only team leader can disband the team") };

    // Remove all members from the tracking map
    for (member in team.members.toArray().values()) {
      teamMembers.remove(member);
    };

    teams.remove(teamId);
  };

  public shared ({ caller }) func leaveTeam() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave teams");
    };
    let teamId = switch (teamMembers.get(caller)) {
      case (null) { Runtime.trap("User is not a member of any team") };
      case (?id) { id };
    };

    let team = checkTeamExists(teamId);

    // Team leader cannot leave - they must disband the team instead
    if (team.leader == caller) {
      Runtime.trap("Team leader cannot leave the team. Use disbandTeam instead.");
    };

    let updatedMembers = team.members.filter(
      func(member) {
        member != caller;
      }
    );

    let updatedTeam = {
      team with
      members = updatedMembers;
    };

    teams.add(teamId, updatedTeam);

    teamMembers.remove(caller);
  };

  public shared ({ caller }) func removeMemberFromTeam(teamId : Nat, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage teams");
    };
    let team = checkTeamExists(teamId);
    if (caller != team.leader) { Runtime.trap("Only team leader can remove members") };

    // Cannot remove the leader
    if (member == team.leader) {
      Runtime.trap("Cannot remove team leader from team");
    };

    let updatedMembers = team.members.filter(
      func(m) {
        m != member;
      }
    );
    let updatedTeam = {
      team with
      members = updatedMembers;
    };

    teams.add(teamId, updatedTeam);

    teamMembers.remove(member);
  };

  public query ({ caller }) func getTeamMembershipStatus() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check membership status");
    };
    teamMembers.get(caller);
  };

  public shared ({ caller }) func uploadFile(teamId : Nat, filename : Text, content : [Nat8]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };
    let team = checkTeamExists(teamId);
    if (not isTeamLeaderOrMember(team, caller)) { Runtime.trap("Only team members can upload files") };
    if (content.size() > maxFileSize) { Runtime.trap("File size exceeds 10 MB limit") };
    let newFile = { filename; content };
    team.files.add(newFile);
  };

  public shared ({ caller }) func uploadTeamIcon(teamId : Nat, filename : Text, contentType : Text, bytes : [Nat8]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload icons");
    };
    let team = checkTeamExists(teamId);
    if (not isTeamLeaderOrMember(team, caller)) { Runtime.trap("Only team members can upload team icons") };
    let image = {
      filename;
      contentType;
      bytes;
    };
    let updatedTeam = {
      team with
      icon = ?image;
    };
    teams.add(teamId, updatedTeam);
  };

  public query ({ caller }) func getInbox() : async [Mail] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inbox");
    };
    let mailbox = switch (mailboxes.get(caller)) {
      case (null) { List.empty<Mail>() };
      case (?mails) { mails };
    };
    mailbox.toArray();
  };

  public shared ({ caller }) func markMailItemAsRead(mailId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark mail as read");
    };
    let mailbox = switch (mailboxes.get(caller)) {
      case (null) { Runtime.trap("Mail item does not exist") };
      case (?mails) { mails };
    };

    var found = false;
    for (mail in mailbox.values()) {
      if (mail.id == mailId) {
        found := true;
      };
    };
    if (not found) { Runtime.trap("Mail item does not exist") };

    let updatedMailbox = mailbox.map<Mail, Mail>(
      func(mailItem) {
        if (mailItem.id == mailId and not mailItem.isRead) {
          { mailItem with isRead = true };
        } else {
          mailItem;
        };
      }
    );
    mailboxes.add(caller, updatedMailbox);
  };

  public shared ({ caller }) func deleteMailItem(mailId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete mail items");
    };
    let mailbox = switch (mailboxes.get(caller)) {
      case (null) { Runtime.trap("Mail item does not exist") };
      case (?mails) { mails };
    };

    var found = false;
    for (mail in mailbox.values()) {
      if (mail.id == mailId) {
        found := true;
      };
    };
    if (not found) { Runtime.trap("Mail item does not exist") };

    let filteredMailbox = mailbox.filter(func(m) { m.id != mailId });
    mailboxes.add(caller, filteredMailbox);
  };

  public shared ({ caller }) func uploadTeamFootage(teamId : Nat, videoId : Text, video : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload team footage");
    };
    let team = checkTeamExists(teamId);
    if (not isTeamLeaderOrMember(team, caller)) { Runtime.trap("Only team members can upload footage") };

    let teamVideo : TeamVideo = {
      videoId;
      video;
      uploader = caller;
    };
    team.videos.add(teamVideo);
  };

  public shared ({ caller }) func deleteTeamFootage(teamId : Nat, videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete team footage");
    };

    let team = checkTeamExists(teamId);
    if (not isTeamLeaderOrMember(team, caller)) { Runtime.trap("Only team members can access footage") };

    // Find the video and check authorization
    var videoFound = false;
    var isAuthorized = false;

    for (teamVideo in team.videos.values()) {
      if (teamVideo.videoId == videoId) {
        videoFound := true;
        // Authorization: caller must be either the uploader OR the team leader
        if (teamVideo.uploader == caller or team.leader == caller) {
          isAuthorized := true;
        };
      };
    };

    if (not videoFound) { Runtime.trap("Video not found") };
    if (not isAuthorized) { Runtime.trap("Unauthorized: Only the video uploader or team leader can delete this footage") };

    let filteredVideos = team.videos.filter(
      func(teamVideo) {
        teamVideo.videoId != videoId;
      }
    );

    let updatedTeam = {
      team with
      videos = filteredVideos;
    };

    teams.add(teamId, updatedTeam);
  };

  public query ({ caller }) func getTeamFootage(teamId : Nat) : async [Storage.ExternalBlob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view team footage");
    };

    let team = checkTeamExists(teamId);

    // Authorization: Only team members can view footage
    if (not isTeamLeaderOrMember(team, caller)) {
      Runtime.trap("Unauthorized: Only team members can view team footage");
    };

    team.videos.toArray().map(func(tv : TeamVideo) : Storage.ExternalBlob { tv.video });
  };

  // New type for mapping member IDs to names
  public type TeamMember = {
    id : Principal;
    name : Text;
  };

  public type TeamWithMemberNamesDTO = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : [TeamMember];
    joinRequests : [Principal];
    files : [PDFDocument];
    icon : ?Image;
    videos : [Storage.ExternalBlob];
  };

  public query ({ caller }) func getTeamWithMemberNames(teamId : Nat) : async TeamWithMemberNamesDTO {
    let team = checkTeamExists(teamId);

    // Fetch names for all members in a single pass
    let memberNames = team.members.toArray().map(
      func(memberId) {
        {
          id = memberId;
          name = switch (userProfiles.get(memberId)) {
            case (null) { "Unknown" };
            case (?profile) { profile.name };
          };
        };
      }
    );

    {
      id = team.id;
      leader = team.leader;
      name = team.name;
      members = memberNames;
      joinRequests = team.joinRequests.toArray();
      files = team.files.toArray();
      icon = team.icon;
      videos = team.videos.toArray().map(func(tv : TeamVideo) : Storage.ExternalBlob { tv.video });
    };
  };

  public shared ({ caller }) func createBattleRequest(requestingTeamId : Nat, targetTeamId : Nat, proposedDate : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create battle requests");
    };

    let requestingTeam = checkTeamExists(requestingTeamId);

    // Only team leader can create battle requests
    if (requestingTeam.leader != caller) {
      Runtime.trap("Unauthorized: Only requesting team leader can create a battle request");
    };

    let _targetTeam = checkTeamExists(targetTeamId);

    let id = nextBattleRequestId;
    let newRequest = {
      id;
      requestingTeam = requestingTeamId;
      targetTeam = targetTeamId;
      proposedDate;
      status = #pending;
    };

    battleRequests.add(id, newRequest);
    nextBattleRequestId += 1;
    id;
  };

  public shared ({ caller }) func respondToBattleRequest(requestId : Nat, accept : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can respond to battle requests");
    };

    let request = switch (battleRequests.get(requestId)) {
      case (null) { Runtime.trap("Battle request does not exist") };
      case (?req) { req };
    };

    let targetTeam = checkTeamExists(request.targetTeam);

    // Only team leader can accept/reject battle requests
    if (targetTeam.leader != caller) {
      Runtime.trap("Unauthorized: Only target team leader can respond to battle requests");
    };

    if (request.status != #pending) {
      Runtime.trap("Battle request is no longer pending");
    };

    // Update status
    let updatedRequest = {
      request with
      status = if (accept) {
        #accepted;
      } else { #rejected };
    };

    battleRequests.add(requestId, updatedRequest);
  };

  public query ({ caller }) func getBattleRequest(requestId : Nat) : async ?BattleRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view battle requests");
    };

    let request = battleRequests.get(requestId);
    switch (request) {
      case (null) { null };
      case (?req) { ?req };
    };
  };

  public query ({ caller }) func listBattleRequestsForTeam(teamId : Nat) : async [BattleRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view battle requests");
    };

    let team = checkTeamExists(teamId);
    if (caller != team.leader) {
      Runtime.trap("Unauthorized: Only team leaders can view battle requests for their team");
    };

    // Return all battle requests where this team is either requesting or target
    battleRequests.values().toArray().filter(
      func(req : BattleRequest) : Bool {
        req.requestingTeam == teamId or req.targetTeam == teamId;
      }
    );
  };
};
