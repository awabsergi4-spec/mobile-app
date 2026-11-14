// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'SAHL';

  @override
  String get getStarted => 'Get Started';

  @override
  String get login => 'Log In';

  @override
  String get register => 'Create Account';

  @override
  String get phoneNumber => 'Phone Number';

  @override
  String get password => 'Password';

  @override
  String get fullName => 'Full Name';

  @override
  String get serviceTypeOnDemand => 'On-Demand';

  @override
  String get serviceTypeContract => 'Contract';

  @override
  String get serviceTypeRemote => 'Remote';

  @override
  String get roleCustomer => 'Customer';

  @override
  String get roleProvider => 'Provider';

  @override
  String get switchToProvider => 'Switch to Provider';

  @override
  String get switchToCustomer => 'Switch to Customer';

  @override
  String get requestStatusSearching => 'Finding a provider…';

  @override
  String get requestStatusAssigned => 'Provider assigned';

  @override
  String get requestStatusEnRoute => 'Provider en route';

  @override
  String get requestStatusInProgress => 'In progress';

  @override
  String get requestStatusCompleted => 'Completed';

  @override
  String get requestStatusCancelled => 'Cancelled';

  @override
  String get errorGeneric => 'Something went wrong. Please try again.';

  @override
  String get errorNoConnection => 'No internet connection.';

  @override
  String get errorTimeout => 'The request took too long. Please try again.';

  @override
  String get errorServerUnavailable =>
      'The server is temporarily unavailable. Please try again shortly.';

  @override
  String get errorValidation => 'Please check the information you entered.';

  @override
  String get errorSessionExpired =>
      'Your session has expired. Please log in again.';

  @override
  String get errorForbidden => 'You don\'t have permission to do that.';

  @override
  String get errorNotFound => 'We couldn\'t find what you\'re looking for.';

  @override
  String get errorConflict => 'This action can\'t be completed right now.';

  @override
  String get errorTooManyRequests =>
      'Too many attempts. Please wait a moment and try again.';

  @override
  String get errorInvalidCredentials => 'Incorrect phone number or password.';

  @override
  String get errorAccountNotActive =>
      'This account isn\'t active. Please contact support.';

  @override
  String get errorUserNotFound =>
      'No account was found with that phone number.';

  @override
  String get errorPhoneAlreadyRegistered =>
      'An account with this phone number already exists.';

  @override
  String get retry => 'Retry';

  @override
  String get cancel => 'Cancel';

  @override
  String get confirm => 'Confirm';

  @override
  String get save => 'Save';

  @override
  String get next => 'Next';

  @override
  String get back => 'Back';

  @override
  String get done => 'Done';

  @override
  String get loading => 'Loading…';

  @override
  String get validationRequired => 'This field is required';

  @override
  String get validationPhoneInvalid => 'Enter a valid phone number';

  @override
  String get validationPasswordTooShort =>
      'Password must be at least 8 characters';

  @override
  String get validationFullNameTooShort => 'Enter your full name';

  @override
  String get loginTitle => 'Welcome back';

  @override
  String get loginSubtitle => 'SAHL connects you with the services you need';

  @override
  String get registerTitle => 'Create your account';

  @override
  String get registerSubtitle => 'It only takes a minute';

  @override
  String get dontHaveAccount => 'Don\'t have an account?';

  @override
  String get alreadyHaveAccount => 'Already have an account?';

  @override
  String get homePlaceholderTitle => 'Home';

  @override
  String loggedInAs(String name) {
    return 'Logged in as $name';
  }

  @override
  String get logout => 'Log Out';

  @override
  String get sessionRestoring => 'Restoring your session…';

  @override
  String homeGreeting(String name) {
    return 'Hi, $name';
  }

  @override
  String get homeNoContent => 'Nothing to show here yet — check back soon.';

  @override
  String get availabilityLabel => 'Availability';

  @override
  String get availabilityOnline => 'Available for jobs';

  @override
  String get availabilityOffline => 'Not available';

  @override
  String get availabilityVacation => 'On vacation';

  @override
  String get availabilityTemporarilyUnavailable => 'Temporarily unavailable';

  @override
  String get availabilityEmergencyOffline => 'Offline (emergency)';

  @override
  String providerJobsCompleted(int count) {
    return '$count jobs completed';
  }

  @override
  String get companyDashboardTitle => 'Company';

  @override
  String companyVerificationStatus(String status) {
    return 'Verification: $status';
  }

  @override
  String get onDemandRequestDetailsTitle => 'Request Details';

  @override
  String get onDemandMyRequests => 'My Requests';

  @override
  String get onDemandNewRequest => 'New Request';

  @override
  String get onDemandCategory => 'Category';

  @override
  String get onDemandDescription => 'What do you need?';

  @override
  String get onDemandLatitude => 'Latitude';

  @override
  String get onDemandLongitude => 'Longitude';

  @override
  String get onDemandLocationHint => 'Enter your location coordinates';

  @override
  String get onDemandEmergency => 'This is an emergency';

  @override
  String get onDemandSubmit => 'Request Service';

  @override
  String get onDemandCancelRequest => 'Cancel Request';

  @override
  String get onDemandCancelConfirmTitle => 'Cancel this request?';

  @override
  String get onDemandCancelConfirmBody => 'This can\'t be undone.';

  @override
  String get onDemandNoRequests => 'You haven\'t requested any services yet.';

  @override
  String get onDemandJobOffers => 'Job Offers';

  @override
  String get onDemandAccept => 'Accept';

  @override
  String get onDemandDecline => 'Decline';

  @override
  String get onDemandNoOffers => 'No job offers right now.';

  @override
  String onDemandQuotedPrice(String amount) {
    return 'Quoted: $amount';
  }

  @override
  String get onDemandEmergencyBadge => 'Emergency';

  @override
  String get contractMyProjects => 'My Projects';

  @override
  String get contractBrowseProjects => 'Browse Projects';

  @override
  String get contractMyBids => 'My Bids';

  @override
  String get contractNewProject => 'New Project';

  @override
  String get contractTitle => 'Title';

  @override
  String get contractDescription => 'Description';

  @override
  String get contractCategory => 'Category';

  @override
  String get contractBudgetMin => 'Budget min (optional)';

  @override
  String get contractBudgetMax => 'Budget max (optional)';

  @override
  String get contractSubmit => 'Post Project';

  @override
  String get contractNoProjects => 'You haven\'t posted any projects yet.';

  @override
  String get contractNoOpenProjects => 'No open projects right now.';

  @override
  String get contractNoBids => 'No bids yet.';

  @override
  String get contractSubmitBid => 'Submit Bid';

  @override
  String get contractBidAmount => 'Your bid amount';

  @override
  String get contractBidMessage => 'Message (optional)';

  @override
  String get contractWithdrawBid => 'Withdraw Bid';

  @override
  String get contractAwardBid => 'Award This Bid';

  @override
  String get contractStatusOpenForBids => 'Open for bids';

  @override
  String get contractStatusAwarded => 'Awarded';

  @override
  String get contractStatusCancelled => 'Cancelled';

  @override
  String get contractBidStatusSubmitted => 'Submitted';

  @override
  String get contractBidStatusAccepted => 'Accepted';

  @override
  String get contractBidStatusRejected => 'Rejected';

  @override
  String get contractBidStatusWithdrawn => 'Withdrawn';

  @override
  String get contractMilestones => 'Milestones';

  @override
  String get contractNewMilestone => 'New Milestone';

  @override
  String get contractMilestoneTitle => 'Milestone title';

  @override
  String get contractMilestoneAmount => 'Amount';

  @override
  String get contractNoMilestones => 'No milestones yet.';

  @override
  String get contractDetailsTitle => 'Project Details';

  @override
  String get remoteMyEngagements => 'My Engagements';

  @override
  String get remoteMyBookings => 'My Bookings';

  @override
  String get remoteNewEngagement => 'New Engagement';

  @override
  String get remoteTitle => 'Title';

  @override
  String get remoteCategory => 'Category';

  @override
  String get remoteSelectCategoryFirst =>
      'Choose a category to see available providers';

  @override
  String get remoteProvider => 'Provider';

  @override
  String get remoteNoProvidersForCategory =>
      'No providers available for this category yet.';

  @override
  String get remotePriceType => 'Price type';

  @override
  String get remotePriceFixed => 'Fixed price';

  @override
  String get remotePriceHourly => 'Hourly rate';

  @override
  String get remoteAmount => 'Amount';

  @override
  String get remoteSubmit => 'Hire Provider';

  @override
  String get remoteNoEngagements => 'No engagements yet.';

  @override
  String get remoteStatusActive => 'Active';

  @override
  String get remoteStatusDelivered => 'Delivered';

  @override
  String get remoteStatusCompleted => 'Completed';

  @override
  String get remoteStatusCancelled => 'Cancelled';

  @override
  String get remoteDetailsTitle => 'Engagement Details';

  @override
  String get remoteMilestones => 'Milestones';

  @override
  String get remoteNewMilestone => 'New Milestone';

  @override
  String get remoteNoMilestones => 'No milestones yet.';

  @override
  String get walletTitle => 'Wallet';

  @override
  String get walletAvailableBalance => 'Available balance';

  @override
  String get walletTransactions => 'Transactions';

  @override
  String get walletNoTransactions => 'No transactions yet.';

  @override
  String get walletWithdrawals => 'Withdrawals';

  @override
  String get walletRequestWithdrawal => 'Request Withdrawal';

  @override
  String get walletWithdrawalAmount => 'Amount';

  @override
  String get walletWithdrawalMethod => 'Payout method';

  @override
  String get walletMethodBankTransfer => 'Bank transfer';

  @override
  String get walletMethodWalletTransfer => 'Wallet transfer';

  @override
  String get walletMethodMobileMoney => 'Mobile money';

  @override
  String get walletNoWithdrawals => 'No withdrawal requests yet.';

  @override
  String get walletSubmitWithdrawal => 'Submit Request';

  @override
  String get withdrawalStatusRequested => 'Requested';

  @override
  String get withdrawalStatusPendingApproval => 'Pending approval';

  @override
  String get withdrawalStatusApproved => 'Approved';

  @override
  String get withdrawalStatusRejected => 'Rejected';

  @override
  String get withdrawalStatusProcessing => 'Processing';

  @override
  String get withdrawalStatusPaid => 'Paid';

  @override
  String get withdrawalStatusFailed => 'Failed';

  @override
  String get disputeMyDisputes => 'My Disputes';

  @override
  String get disputeNoDisputes => 'You haven\'t opened any disputes.';

  @override
  String get disputeOpenAction => 'Open Dispute';

  @override
  String get disputeReason => 'What went wrong?';

  @override
  String get disputeSubmit => 'Submit Dispute';

  @override
  String get disputeStatusOpen => 'Open';

  @override
  String get disputeStatusUnderReview => 'Under review';

  @override
  String get disputeStatusResolved => 'Resolved';

  @override
  String get disputeStatusRejected => 'Rejected';

  @override
  String disputeResolutionNotes(String notes) {
    return 'Resolution: $notes';
  }

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsMarkAllRead => 'Mark all as read';

  @override
  String get notificationsNoNotifications => 'No notifications yet.';

  @override
  String get companyMembersTitle => 'Members';

  @override
  String get companyPendingInvitations => 'Pending Invitations';

  @override
  String get companyNoMembers => 'No members yet.';

  @override
  String get companyNoPendingInvitations => 'No pending invitations.';

  @override
  String get companyInviteMember => 'Invite Member';

  @override
  String get companyInvitedPhone => 'Phone number';

  @override
  String get companyRole => 'Role';

  @override
  String get companyRoleOwner => 'Owner';

  @override
  String get companyRoleManager => 'Manager';

  @override
  String get companyRoleStaff => 'Staff';

  @override
  String get companySendInvite => 'Send Invite';

  @override
  String get companyRemoveMember => 'Remove';

  @override
  String get companyRemoveMemberConfirmTitle => 'Remove this member?';

  @override
  String get companyRemoveMemberConfirmBody =>
      'They will lose access to this company.';

  @override
  String get companyCancelInvitation => 'Cancel';

  @override
  String get companyInvitationStatusPending => 'Pending';

  @override
  String get companyInvitationStatusAccepted => 'Accepted';

  @override
  String get companyInvitationStatusRejected => 'Rejected';

  @override
  String get companyInvitationStatusExpired => 'Expired';

  @override
  String get companyInvitationStatusCancelled => 'Cancelled';

  @override
  String get companyDocumentsTitle => 'Verification Documents';

  @override
  String get companyNoDocuments => 'No documents uploaded yet.';

  @override
  String get companyAddDocument => 'Add Document';

  @override
  String get companyDocumentType => 'Document type';

  @override
  String get companyDocumentFileUrl => 'File URL';

  @override
  String get companyDocumentStatusPending => 'Pending review';

  @override
  String get companyDocumentStatusApproved => 'Approved';

  @override
  String get companyDocumentStatusRejected => 'Rejected';

  @override
  String get companySubmitVerification => 'Submit for Verification';

  @override
  String get companyVerificationSubmitted => 'Submitted for review.';

  @override
  String get companyMyInvitationsTitle => 'My Invitations';

  @override
  String get companyNoInvitations => 'You have no pending invitations.';

  @override
  String companyInvitedToJoin(String companyName, String role) {
    return 'Invited to join $companyName as $role';
  }

  @override
  String get companyAccept => 'Accept';

  @override
  String get providerProfileTitle => 'Provider Profile';

  @override
  String get providerEditProfile => 'Edit Profile';

  @override
  String get providerBusinessName => 'Business name';

  @override
  String get providerBio => 'Bio';

  @override
  String get providerYearsOfExperience => 'Years of experience';

  @override
  String get providerSkills => 'Skills (comma-separated)';

  @override
  String get providerTravelDistanceKm => 'Travel distance (km)';

  @override
  String get providerRemoteAvailable => 'Available for remote work';

  @override
  String get providerEmergencyAvailable => 'Available for emergency jobs';

  @override
  String get providerEmergencyContactName => 'Emergency contact name';

  @override
  String get providerEmergencyContactPhone => 'Emergency contact phone';

  @override
  String get providerSaveProfile => 'Save';

  @override
  String get providerDocumentsTitle => 'Verification Documents';

  @override
  String get providerNoDocuments => 'No documents uploaded yet.';

  @override
  String get providerAddDocument => 'Add Document';

  @override
  String get providerDocumentType => 'Document type';

  @override
  String get providerDocumentFileUrl => 'File URL';

  @override
  String get providerDocumentStatusPending => 'Pending review';

  @override
  String get providerDocumentStatusApproved => 'Approved';

  @override
  String get providerDocumentStatusRejected => 'Rejected';

  @override
  String get providerSubmitVerification => 'Submit for Verification';

  @override
  String get providerVerificationSubmitted => 'Submitted for review.';

  @override
  String get providerPortfolioTitle => 'Portfolio';

  @override
  String get providerNoPortfolioItems => 'No portfolio items yet.';

  @override
  String get providerAddPortfolioItem => 'Add Item';

  @override
  String get providerPortfolioMediaUrl => 'Media URL';

  @override
  String get providerPortfolioItemTitle => 'Title (optional)';

  @override
  String get providerPortfolioItemDescription => 'Description (optional)';

  @override
  String get providerDeleteItem => 'Delete';

  @override
  String get providerPayoutAccountsTitle => 'Payout Accounts';

  @override
  String get providerNoPayoutAccounts => 'No payout accounts yet.';

  @override
  String get providerAddPayoutAccount => 'Add Payout Account';

  @override
  String get providerSetDefault => 'Set as default';

  @override
  String get providerDefaultBadge => 'Default';

  @override
  String get providerBankName => 'Bank name';

  @override
  String get providerAccountNumber => 'Account number';

  @override
  String get providerAccountHolderName => 'Account holder name';

  @override
  String get providerWalletPhone => 'Wallet phone number';

  @override
  String get providerMobileMoneyProvider => 'Mobile money provider';

  @override
  String get providerPhoneNumber => 'Phone number';

  @override
  String get onboardingTitle1 => 'All your services';

  @override
  String get onboardingHighlight1 => 'in one place';

  @override
  String get onboardingBody1 =>
      'From instant jobs to long-term projects — simply and safely';

  @override
  String get onboardingTitle2 => 'Trusted providers';

  @override
  String get onboardingHighlight2 => 'near you';

  @override
  String get onboardingBody2 =>
      'Every provider is reviewed before joining SAHL';

  @override
  String get onboardingTitle3 => 'Pay safely';

  @override
  String get onboardingHighlight3 => 'track every step';

  @override
  String get onboardingBody3 =>
      'Your payment is held until the job is done and approved';

  @override
  String get alreadyHaveAccountLogin => 'I already have an account';

  @override
  String get switchLanguage => 'العربية';

  @override
  String get showPassword => 'Show password';

  @override
  String get hidePassword => 'Hide password';

  @override
  String get createAccountLink => 'Create account';

  @override
  String get registerChooseTitle => 'Create a new account';

  @override
  String get registerChooseSubtitle => 'Choose an account type to continue';

  @override
  String get accountTypeCustomer => 'Customer';

  @override
  String get accountTypeCustomerHint => 'Request services easily';

  @override
  String get accountTypeProvider => 'Service provider';

  @override
  String get accountTypeProviderHint => 'Offer your services and earn';

  @override
  String get accountTypeCompany => 'Company';

  @override
  String get accountTypeCompanyHint => 'Manage your company\'s services';

  @override
  String get continueAction => 'Continue';

  @override
  String get registerDetailsTitleCustomer => 'Create a customer account';

  @override
  String get registerDetailsTitleProvider => 'Create a provider account';

  @override
  String get registerDetailsTitleCompany => 'Create a company account';

  @override
  String get registerDetailsSubtitle => 'Enter your details to continue';

  @override
  String get emailOptional => 'Email (optional)';

  @override
  String get confirmPassword => 'Confirm password';

  @override
  String get businessName => 'Business name';

  @override
  String get companyName => 'Company name';

  @override
  String get validationPasswordsDontMatch => 'Passwords don\'t match';

  @override
  String get validationEmailInvalid => 'Enter a valid email';

  @override
  String get termsNotice =>
      'By continuing, you agree to SAHL\'s Terms & Conditions';

  @override
  String get registerSuccessTitle => 'Your account was created!';

  @override
  String get registerPendingBody =>
      'We\'re reviewing your account. You can log in as soon as an administrator approves it.';

  @override
  String get backToLogin => 'Back to log in';

  @override
  String get errorAccountPendingApproval =>
      'Your account is waiting for admin approval. You can log in once it\'s approved.';

  @override
  String get errorEmailAlreadyRegistered =>
      'An account with this email already exists.';
}
