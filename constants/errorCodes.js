const ErrorCodes = {
    Base: {
        UnknownError: "Base.UnknownError"
    },
    Reports: {
        NotFound: "Reports.NotFound",
        CreationFailed: "Reports.CreationFailed",
        UpdateFailed: "Reports.UpdateFailed",
        FetchFailed: "Reports.FetchFailed",
        AlreadyReported: "Reports.AlreadyReported",
        InvalidReason: "Reports.InvalidReason"
    },
    Comments: {
        NotFound: "Comments.NotFound",
        CreationFailed: "Comments.CreationFailed",
        UpdateFailed: "Comments.UpdateFailed",
        DeletionFailed: "Comments.DeletionFailed",
        FetchFailed: "Comments.FetchFailed",
        AlreadyCommented: "Comments.AlreadyCommented",
        InvalidContent: "Comments.InvalidContent",
        Unauthorized: "Comments.Unauthorized"
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
        noToken: "Login.noToken",
        InvalidSession: "Login.InvalidSession",
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
        AlreadyAdmin: "User.AlreadyAdmin",
        SearchFailed: "User.SearchFailed",
        InvalidSearchQuery: "User.InvalidSearchQuery"
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