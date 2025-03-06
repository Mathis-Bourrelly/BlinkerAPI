const ErrorCodes = {
    Base: {
        UnknownError: "Base.UnknownError"
    },
    Blinks: {
        NotFound: "Blinks.NotFound",
        InvalidFormat: "Blinks.InvalidFormat",
        InvalidContentType: "Blinks.InvalidContentType",
        CreationFailed: "Blinks.CreationFailed",
        ContentAdditionFailed: "Blinks.ContentAdditionFailed",
        DeletionFailed: "Blinks.DeletionFailed",
        FetchFailed: "Blinks.FetchFailed",
        ContentsDeletionFailed: "Blinks.ContentsDeletionFailed",
        InvalidSearchQuery: "Blinks.InvalidSearchQuery",
        SearchFailed: "Blinks.SearchFailed"
    },
    Login: {
        InvalidToken: "Login.InvalidToken",
        IncorrectPassword: "Login.IncorrectPassword",
        UserNotFound: "Login.UserNotFound",
        AccountLocked: "Login.AccountLocked",
        InvalidEmail: "Login.InvalidEmail",
        FieldEmailRequired: "Login.FieldEmailRequired",
        FieldPasswordRequired: "Login.FieldPasswordRequired",
        AccessDenied: "Login.AccessDenied",
    },
    User: {
        NotFound: "User.NotFound",
        EmailAlreadyExists: "User.EmailAlreadyExists",
        CreationFailed: "User.CreationFailed",
        UpdateFailed: "User.UpdateFailed",
        DeletionFailed: "User.DeletionFailed",
        AccountAlreadyVerified: "User.AccountAlreadyVerified",
        InvalidResetToken: "User.InvalidResetToken",
        WeakPassword: "User.WeakPassword",
        AlreadyAdmin: "User.AlreadyAdmin"
    },
    Follows: {
        AlreadyFollowing: "Follows.AlreadyFollowing",
        FollowFailed: "Follows.FollowFailed",
        UnfollowFailed: "Follows.UnfollowFailed",
        NotFollowing: "Follows.NotFollowing",
        FetchFailed: "Follows.FetchFailed",
        SelfFollowNotAllowed: "Follows.SelfFollowNotAllowed"
    },
    Profiles: {
        NotFound: "Profiles.NotFound",
        UsernameTaken: "Profiles.UsernameTaken",
        CreationFailed: "Profiles.CreationFailed"
    }
};

module.exports = ErrorCodes;