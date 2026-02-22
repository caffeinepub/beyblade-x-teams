import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldTeam = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<{
      filename : Text;
      content : [Nat8];
    }>;
    icon : ?{
      filename : Text;
      contentType : Text;
      bytes : [Nat8];
    };
    videos : List.List<{
      videoId : Text;
      video : Storage.ExternalBlob;
      uploader : Principal;
    }>;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, {
      name : Text;
      profilePicture : ?Storage.ExternalBlob;
      aboutMe : Text;
    }>;
    mailboxes : Map.Map<Principal, List.List<{
      id : Nat;
      recipient : Principal;
      sender : Principal;
      mailType : {
        #joinRequest;
        #notification;
      };
      content : {
        #joinRequest : {
          teamId : Nat;
          requester : Principal;
          message : Text;
        };
        #notification : Text;
      };
      isRead : Bool;
    }>>;
    nextMailId : Nat;
    nextTeamId : Nat;
    maxTeamSize : Nat;
    maxFileSize : Nat;
    teamMembers : Map.Map<Principal, Nat>;
    teams : Map.Map<Nat, OldTeam>;
  };

  type NewTeam = OldTeam;

  type NewActor = {
    userProfiles : Map.Map<Principal, {
      name : Text;
      profilePicture : ?Storage.ExternalBlob;
      aboutMe : Text;
    }>;
    mailboxes : Map.Map<Principal, List.List<{
      id : Nat;
      recipient : Principal;
      sender : Principal;
      mailType : {
        #joinRequest;
        #notification;
      };
      content : {
        #joinRequest : {
          teamId : Nat;
          requester : Principal;
          message : Text;
        };
        #notification : Text;
      };
      isRead : Bool;
    }>>;
    nextMailId : Nat;
    nextTeamId : Nat;
    maxTeamSize : Nat;
    maxFileSize : Nat;
    teamMembers : Map.Map<Principal, Nat>;
    teams : Map.Map<Nat, NewTeam>;
  };

  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      mailboxes = old.mailboxes;
      nextMailId = old.nextMailId;
      nextTeamId = old.nextTeamId;
      maxTeamSize = old.maxTeamSize;
      maxFileSize = old.maxFileSize;
      teamMembers = old.teamMembers;
      teams = old.teams;
    };
  };
};
