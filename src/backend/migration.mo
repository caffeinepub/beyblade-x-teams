import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  public type OldActor = {
    teams : Map.Map<Nat, OldTeam>;
  };

  public type OldTeam = {
    id : Nat;
    leader : Principal;
    name : Text;
    members : Set.Set<Principal>;
    joinRequests : List.List<Principal>;
    files : List.List<PDFDocument>;
    icon : ?Image;
    videos : List.List<Storage.ExternalBlob>;
  };

  public type NewActor = {
    teamMembers : Map.Map<Principal, Nat>;
    teams : Map.Map<Nat, OldTeam>;
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

  func buildTeamMembersMapping(teams : Map.Map<Nat, OldTeam>) : Map.Map<Principal, Nat> {
    let teamMembers = Map.empty<Principal, Nat>();
    for ((teamId, team) in teams.entries()) {
      teamMembers.add(team.leader, teamId);
      for (member in team.members.toArray().values()) {
        teamMembers.add(member, teamId);
      };
    };
    teamMembers;
  };

  public func run(oldActor : OldActor) : NewActor {
    let teamMembers = buildTeamMembersMapping(oldActor.teams);
    {
      teamMembers;
      teams = oldActor.teams;
    };
  };
};
