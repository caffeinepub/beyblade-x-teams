import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  public type UserProfile = {
    name : Text;
    profilePicture : ?Storage.ExternalBlob;
    aboutMe : Text;
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

  public type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    mailboxes : Map.Map<Principal, List.List<Mail>>;
    teamMembers : Map.Map<Principal, Nat>;
    teams : Map.Map<Nat, Team>;
    battleRequests : Map.Map<Nat, BattleRequest>;
    nextMailId : Nat;
    nextTeamId : Nat;
    nextBattleRequestId : Nat;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    mailboxes : Map.Map<Principal, List.List<Mail>>;
    teamMembers : Map.Map<Principal, Nat>;
    teams : Map.Map<Nat, Team>;
    battleRequests : Map.Map<Nat, BattleRequest>;
    nextMailId : Nat;
    nextTeamId : Nat;
    nextBattleRequestId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      mailboxes = old.mailboxes;
      teamMembers = old.teamMembers;
      teams = old.teams;
      battleRequests = old.battleRequests;
      nextMailId = old.nextMailId;
      nextTeamId = old.nextTeamId;
      nextBattleRequestId = old.nextBattleRequestId;
    };
  };
};
