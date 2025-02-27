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
        ContentsDeletionFailed: "Blinks.ContentsDeletionFailed"
    },
    Login: {
        IncorrectPassword: "Login.IncorrectPassword",
        UserNotFound: "Login.UserNotFound",
        AccountLocked: "Login.AccountLocked",
        InvalidEmail: "Login.InvalidEmail",
        FieldEmailRequired: "Login.FieldEmailRequired",
        FieldPasswordRequired: "Login.FieldPasswordRequired"
    },
    User: {
        NotFound: "User.NotFound",
        EmailAlreadyExists: "User.EmailAlreadyExists",
        InvalidToken: "User.InvalidToken"
    },
    Follows: {
        AlreadyFollowing: "Follows.AlreadyFollowing",
        FollowFailed: "Follows.FollowFailed",
        UnfollowFailed: "Follows.UnfollowFailed",
        NotFollowing: "Follows.NotFollowing",
        FetchFailed: "Follows.FetchFailed",
        SelfFollowNotAllowed: "Follows.SelfFollowNotAllowed"
    }
};

module.exports = ErrorCodes;