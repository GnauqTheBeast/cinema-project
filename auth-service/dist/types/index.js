export var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(HttpStatus || (HttpStatus = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (UserStatus = {}));
export var ErrorMessages;
(function (ErrorMessages) {
    ErrorMessages["CUSTOMER_ONLY"] = "Ch\u1EC9 cho ph\u00E9p \u0111\u0103ng k\u00FD t\u00E0i kho\u1EA3n Customer.";
    ErrorMessages["EMAIL_EXISTS"] = "Email already exists";
    ErrorMessages["INVALID_CREDENTIALS"] = "Invalid email or password";
    ErrorMessages["REGISTRATION_SUCCESS"] = "Registered successfully. Please check your email to verify.";
    ErrorMessages["OTP_EXPIRED"] = "OTP expired or not found";
    ErrorMessages["OTP_MAX_ATTEMPTS"] = "Maximum OTP attempts exceeded. Please request a new OTP.";
    ErrorMessages["OTP_VERIFIED"] = "OTP verified successfully";
    ErrorMessages["ACCOUNT_VERIFIED"] = "Account verified and activated successfully";
})(ErrorMessages || (ErrorMessages = {}));
//# sourceMappingURL=index.js.map