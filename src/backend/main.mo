import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // User Profile Management
  public type UserProfile = {
    name : Text;
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

  // Team Icon Management
  public type Image = {
    filename : Text;
    contentType : Text;
    bytes : [Nat8];
  };

  public type PDFDocument = {
    filename : Text;
    content : [Nat8];
  };

  public type Team = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<PDFDocument>;
    icon : ?Image;
    videos : List.List<Storage.ExternalBlob>;
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

  func teamToDTO(team : Team) : TeamDTO {
    {
      id = team.id;
      leader = team.leader;
      name = team.name;
      members = team.members.toArray();
      joinRequests = team.joinRequests.toArray();
      files = team.files.toArray();
      icon = team.icon;
      videos = team.videos.toArray();
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

  public shared ({ caller }) func createTeam(name : Text, initialMembers : [Principal]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create teams");
    };
    if (initialMembers.size() > maxTeamSize) { Runtime.trap("Team must have at most " # maxTeamSize.toText() # " members") };
    
    // AUTHORIZATION FIX: Check if caller is already in a team before creating
    checkTeamMemberExists(caller);

    // Check if any member is already in a team. If so, abort.
    let members = Set.empty<Principal>();
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
      videos = List.empty<Storage.ExternalBlob>();
    };
    teams.add(teamId, newTeam);
    nextTeamId += 1;

    // AUTHORIZATION FIX: Add leader to team members tracking
    teamMembers.add(caller, teamId);

    // Add all new members to the set of team members
    for (member in members.toArray().values()) {
      teamMembers.add(member, teamId);
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
    
    // AUTHORIZATION FIX: Check if caller is already in a team before requesting to join
    checkTeamMemberExists(caller);
    
    let team = checkTeamExists(teamId);

    if (team.members.contains(caller)) { Runtime.trap("User is already a member of this team") };

    // Check if already requested
    for (existingRequest in team.joinRequests.values()) {
      if (existingRequest == caller) { Runtime.trap("User already requested to join") };
    };

    // Add to team's join requests list
    team.joinRequests.add(caller);

    // Send mail to team leader
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

      // AUTHORIZATION FIX: Check if the user is already in any team before approving
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
    teamMembers.remove(team.leader);

    teams.remove(teamId);
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
    if (not team.members.contains(caller)) { Runtime.trap("Only team members can upload files") };
    if (content.size() > maxFileSize) { Runtime.trap("File size exceeds 10 MB limit") };
    let newFile = { filename; content };
    team.files.add(newFile);
  };

  public shared ({ caller }) func uploadTeamIcon(teamId : Nat, filename : Text, contentType : Text, bytes : [Nat8]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload icons");
    };
    let team = checkTeamExists(teamId);
    if (not team.members.contains(caller)) { Runtime.trap("Only team members can upload team icons") };
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

  public shared ({ caller }) func uploadTeamFootage(teamId : Nat, video : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload team footage");
    };
    let team = checkTeamExists(teamId);
    if (not team.members.contains(caller)) { Runtime.trap("Only team members can upload footage") };
    team.videos.add(video);
  };

  public query ({ caller }) func getTeamFootage(teamId : Nat) : async [Storage.ExternalBlob] {
    let team = checkTeamExists(teamId);
    team.videos.toArray();
  };
};

