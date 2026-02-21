import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Locally redefine PDFDocument for use in migration
  type PDFDocument = {
    filename : Text;
    content : [Nat8];
  };

  // Locally redefine Image for use in migration
  type Image = {
    filename : Text;
    contentType : Text;
    bytes : [Nat8];
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldTeamVideo = Storage.ExternalBlob;

  type OldTeam = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<PDFDocument>;
    icon : ?Image;
    videos : List.List<OldTeamVideo>;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    teams : Map.Map<Nat, OldTeam>;
  };

  type NewUserProfile = {
    name : Text;
    profilePicture : ?Storage.ExternalBlob;
    aboutMe : Text;
  };

  type NewTeamVideo = {
    videoId : Text;
    video : Storage.ExternalBlob;
    uploader : Principal;
  };

  type NewTeam = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<PDFDocument>;
    icon : ?Image;
    videos : List.List<NewTeamVideo>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    teams : Map.Map<Nat, NewTeam>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldUserProfile) {
        {
          name = oldUserProfile.name;
          profilePicture = null;
          aboutMe = "";
        };
      }
    );

    let newTeams = old.teams.map<Nat, OldTeam, NewTeam>(
      func(_teamId, oldTeam) {
        let newVideos = oldTeam.videos.map<OldTeamVideo, NewTeamVideo>(
          func(oldVideo) {
            {
              videoId = "";
              video = oldVideo;
              uploader = oldTeam.leader; // Default to team leader for existing videos
            };
          }
        );
        {
          oldTeam with
          videos = newVideos;
        };
      }
    );

    {
      userProfiles = newUserProfiles;
      teams = newTeams;
    };
  };
};

