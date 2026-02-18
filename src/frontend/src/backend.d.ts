import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Mail {
    id: bigint;
    content: MailContent;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    mailType: MailType;
}
export interface PDFDocument {
    content: Uint8Array;
    filename: string;
}
export interface TeamDTO {
    id: bigint;
    files: Array<PDFDocument>;
    members: Array<Principal>;
    joinRequests: Array<Principal>;
    icon?: Image;
    name: string;
    leader: Principal;
    videos: Array<ExternalBlob>;
}
export type MailContent = {
    __kind__: "notification";
    notification: string;
} | {
    __kind__: "joinRequest";
    joinRequest: {
        requester: Principal;
        message: string;
        teamId: bigint;
    };
};
export interface Image {
    contentType: string;
    filename: string;
    bytes: Uint8Array;
}
export interface UserProfile {
    name: string;
}
export enum MailType {
    notification = "notification",
    joinRequest = "joinRequest"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveJoinRequests(teamId: bigint, approvals: Array<Principal>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTeam(name: string, initialMembers: Array<Principal>): Promise<bigint>;
    deleteMailItem(mailId: bigint): Promise<void>;
    denyJoinRequests(teamId: bigint, denials: Array<Principal>): Promise<void>;
    disbandTeam(teamId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInbox(): Promise<Array<Mail>>;
    getTeam(teamId: bigint): Promise<TeamDTO>;
    getTeamFootage(teamId: bigint): Promise<Array<ExternalBlob>>;
    getTeamMembershipStatus(): Promise<bigint | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listTeams(): Promise<Array<TeamDTO>>;
    markMailItemAsRead(mailId: bigint): Promise<void>;
    requestJoinTeam(teamId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadFile(teamId: bigint, filename: string, content: Uint8Array): Promise<void>;
    uploadTeamFootage(teamId: bigint, video: ExternalBlob): Promise<void>;
    uploadTeamIcon(teamId: bigint, filename: string, contentType: string, bytes: Uint8Array): Promise<void>;
}
