export interface AuthenticatedUser {
    id: string;
    email: string;
    rol?: string;
    name?: string;
    image?: string;
}

export interface AuthenticatedRequest {
    user?: AuthenticatedUser;
    headers: {
        authorization?: string;
    };
}
