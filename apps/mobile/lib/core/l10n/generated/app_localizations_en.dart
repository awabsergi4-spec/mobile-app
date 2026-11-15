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

  @override
  String get navHome => 'Home';

  @override
  String get navExplore => 'Explore';

  @override
  String get navRequests => 'Requests';

  @override
  String get navWallet => 'Wallet';

  @override
  String get navProfile => 'Profile';

  @override
  String get navDashboard => 'Dashboard';

  @override
  String get navJobs => 'Jobs';

  @override
  String get navServices => 'Services';

  @override
  String get navEarnings => 'Earnings';

  @override
  String get navTeam => 'Team';

  @override
  String get navFinance => 'Finance';

  @override
  String get roleCompany => 'Company';

  @override
  String get homeSearchHint => 'Search for a service…';

  @override
  String get homeServiceTypesTitle => 'What do you need today?';

  @override
  String get homeForYou => 'For you';

  @override
  String get serviceTypeShortTerm => 'Short-Term';

  @override
  String get serviceTypeLongTerm => 'Long-Term';

  @override
  String get serviceTypeOnDemandHint => 'Fast help, right now';

  @override
  String get serviceTypeShortTermHint => 'Remote tasks & short projects';

  @override
  String get serviceTypeLongTermHint => 'Contracts & big projects';

  @override
  String get exploreTitle => 'Explore services';

  @override
  String get exploreEmpty => 'No services in this category yet.';

  @override
  String get exploreRequestAction => 'View details';

  @override
  String get requestsTitle => 'My Requests';

  @override
  String get requestsOnDemandSubtitle => 'Instant jobs you requested';

  @override
  String get requestsShortTermSubtitle => 'Remote work you booked';

  @override
  String get requestsLongTermSubtitle => 'Projects, bids and contracts';

  @override
  String get requestsDisputesSubtitle => 'Problems you reported';

  @override
  String get providerStatRating => 'Rating';

  @override
  String get providerStatCompleted => 'Completed jobs';

  @override
  String get providerStatBalance => 'Available balance';

  @override
  String get jobsTitle => 'Jobs';

  @override
  String get jobsOffersSubtitle => 'New on-demand requests sent to you';

  @override
  String get jobsBookingsSubtitle => 'Short-term work customers booked';

  @override
  String get jobsBidsSubtitle => 'Your offers on long-term projects';

  @override
  String get jobsBrowseSubtitle => 'Find long-term projects to bid on';

  @override
  String get servicesTitle => 'My Services';

  @override
  String get servicesPortfolioSubtitle => 'Show customers your best work';

  @override
  String get servicesVerificationSubtitle =>
      'Documents that verify your account';

  @override
  String get servicesProfileSubtitle => 'Business name, bio, skills';

  @override
  String get companyStatMembers => 'Team members';

  @override
  String get companyStatPendingInvites => 'Pending invitations';

  @override
  String get companyTeamSubtitle => 'Invite members and manage roles';

  @override
  String get companyVerificationSubtitle =>
      'Business documents and verification';

  @override
  String get companyJobsUnavailableTitle => 'Company jobs are coming';

  @override
  String get companyJobsUnavailable =>
      'Assigning requests to your team and tracking their progress isn\'t available yet. It\'s being added in the next update.';

  @override
  String get companyFinanceUnavailableTitle => 'Company finance is coming';

  @override
  String get companyFinanceUnavailable =>
      'Company revenue, payments and reports aren\'t available yet. They\'re being added in the next update.';

  @override
  String get profileTitle => 'Profile';

  @override
  String get accountSection => 'Account';

  @override
  String get activitySection => 'Activity';

  @override
  String get settingsSection => 'Settings';

  @override
  String get appearance => 'Appearance';

  @override
  String get themeSystem => 'System';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get language => 'Language';

  @override
  String get languageArabic => 'العربية';

  @override
  String get languageEnglish => 'English';

  @override
  String get logoutConfirmTitle => 'Log out?';

  @override
  String get logoutConfirmMessage =>
      'You\'ll need to sign in again to use SAHL on this device.';

  @override
  String get seeAll => 'See all';

  @override
  String get homeActiveRequest => 'Your active request';

  @override
  String get homeRecommended => 'Top-rated providers';

  @override
  String get homePromotions => 'Offers for you';

  @override
  String promoPercentOff(int value) {
    return '$value% off';
  }

  @override
  String promoFlatOff(int amount) {
    return 'Save $amount';
  }

  @override
  String get searchCategories => 'Services';

  @override
  String get searchProviders => 'Providers';

  @override
  String searchNoResults(String query) {
    return 'Nothing matches “$query”.';
  }

  @override
  String get serviceProvidersTitle => 'Providers';

  @override
  String serviceProvidersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count providers',
      one: '1 provider',
    );
    return '$_temp0';
  }

  @override
  String priceFrom(String amount) {
    return 'From $amount';
  }

  @override
  String priceRange(String min, String max) {
    return '$min – $max';
  }

  @override
  String get priceOnRequest => 'Price on request';

  @override
  String get sortRating => 'Top rated';

  @override
  String get sortJobs => 'Most jobs';

  @override
  String get sortNewest => 'Newest';

  @override
  String get requestServiceAction => 'Request this service';

  @override
  String get postProjectAction => 'Post a project';

  @override
  String get serviceNoProviders => 'No providers offer this service yet.';

  @override
  String get onDemandMatchingNote =>
      'We send your request to the best available provider near you — no need to pick one.';

  @override
  String get remotePickProviderNote =>
      'Choose a provider below to book this service.';

  @override
  String get verifiedProvider => 'Verified';

  @override
  String yearsExperience(int years) {
    String _temp0 = intl.Intl.pluralLogic(
      years,
      locale: localeName,
      other: '$years yrs experience',
      one: '1 yr experience',
    );
    return '$_temp0';
  }

  @override
  String jobsDone(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count jobs',
      one: '1 job',
    );
    return '$_temp0';
  }

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reviews',
      one: '1 review',
      zero: 'No reviews',
    );
    return '$_temp0';
  }

  @override
  String get aboutTitle => 'About';

  @override
  String get skillsTitle => 'Skills';

  @override
  String get servicesOffered => 'Services';

  @override
  String get reviewsTitle => 'Reviews';

  @override
  String get noReviewsYet => 'No reviews yet.';

  @override
  String get bookProviderAction => 'Book this provider';

  @override
  String memberOfCompany(String company) {
    return 'Part of $company';
  }

  @override
  String get bookingTitle => 'Request a service';

  @override
  String bookingStepOf(int step, int total) {
    return 'Step $step of $total';
  }

  @override
  String get bookingStepService => 'Which service do you need?';

  @override
  String get bookingStepDetails => 'Tell us about the job';

  @override
  String get bookingStepLocation => 'Where should the provider come?';

  @override
  String get bookingStepTime => 'When do you need it?';

  @override
  String get bookingStepReview => 'Check your request';

  @override
  String get bookingDescribeHint =>
      'Describe what you need, e.g. the kitchen tap is leaking…';

  @override
  String get bookingEmergency => 'This is an emergency';

  @override
  String get bookingEmergencyHint =>
      'Emergency requests are offered to providers first';

  @override
  String get bookingUseLocation => 'Use my current location';

  @override
  String get bookingLocating => 'Getting your location…';

  @override
  String get bookingLocationSet => 'Location set';

  @override
  String get bookingLocationDenied =>
      'Location permission was denied. Allow it in your phone settings to continue.';

  @override
  String get bookingLocationOff => 'Turn on location services to continue.';

  @override
  String get bookingLocationFailed =>
      'Couldn\'t get your location. Please try again.';

  @override
  String get bookingAddressHint => 'Address or landmark (optional)';

  @override
  String get bookingNow => 'As soon as possible';

  @override
  String get bookingSchedule => 'Schedule for later';

  @override
  String get bookingPickTime => 'Pick date & time';

  @override
  String get bookingSubmit => 'Send request';

  @override
  String get bookingSuccessTitle => 'Request sent!';

  @override
  String get bookingSuccessMessage =>
      'We\'re finding the best available provider. Follow updates in My Requests.';

  @override
  String get bookingScheduledSuccessMessage =>
      'Your request is scheduled. Follow updates in My Requests.';

  @override
  String get viewMyRequests => 'View my requests';

  @override
  String get addressPrefix => 'Address';

  @override
  String get requestsBucketAll => 'All';

  @override
  String get requestsBucketPending => 'Pending';

  @override
  String get requestsBucketAccepted => 'Accepted';

  @override
  String get requestsBucketInProgress => 'In progress';

  @override
  String get requestsBucketCompleted => 'Completed';

  @override
  String get requestsBucketCancelled => 'Cancelled';

  @override
  String get requestsEmpty => 'Nothing here yet.';

  @override
  String scheduledFor(String date) {
    return 'Scheduled for $date';
  }

  @override
  String requestedOn(String date) {
    return 'Requested $date';
  }

  @override
  String get assignedProvider => 'Your provider';

  @override
  String get rateService => 'Rate this service';

  @override
  String get reviewTitle => 'How was the service?';

  @override
  String get reviewCommentHint =>
      'Tell others about your experience (optional)';

  @override
  String get reviewSubmit => 'Submit review';

  @override
  String get reviewThanks => 'Thanks for your review!';

  @override
  String get yourRating => 'Your rating';

  @override
  String get milestoneStatusPending => 'Not started';

  @override
  String get milestoneStatusInProgress => 'In progress';

  @override
  String get milestoneStatusSubmitted => 'Waiting for approval';

  @override
  String get milestoneStatusApproved => 'Approved';

  @override
  String get milestoneStatusPaid => 'Paid';

  @override
  String get milestoneStart => 'Start work';

  @override
  String get milestoneSubmit => 'Submit for approval';

  @override
  String get milestoneApprove => 'Approve';

  @override
  String get milestoneApproveConfirm => 'Approve this milestone?';

  @override
  String get milestoneApproveMessage =>
      'Approving confirms the work for this milestone is done. SAHL then releases the payment.';

  @override
  String get cancelProject => 'Cancel project';

  @override
  String get cancelProjectConfirm => 'Cancel this project?';

  @override
  String get cancelProjectMessage =>
      'Open bids will be rejected. This can\'t be undone.';

  @override
  String get walletPending => 'Pending';

  @override
  String get walletLocked => 'On hold';

  @override
  String get txStatusPending => 'Pending';

  @override
  String get txStatusHeld => 'On hold';

  @override
  String get txStatusSucceeded => 'Completed';

  @override
  String get txStatusFailed => 'Failed';

  @override
  String get txStatusReversed => 'Reversed';

  @override
  String get editProfile => 'Edit profile';

  @override
  String get editProfileSaved => 'Profile updated';

  @override
  String get cityLabel => 'City';

  @override
  String get addressLabel => 'Address';

  @override
  String get bioLabel => 'About me';

  @override
  String get saveChanges => 'Save changes';

  @override
  String get security => 'Security';

  @override
  String get changePassword => 'Change password';

  @override
  String get currentPassword => 'Current password';

  @override
  String get newPassword => 'New password';

  @override
  String get passwordChanged =>
      'Password changed. You were signed out on other devices.';

  @override
  String get notificationPrefsTitle => 'Notification preferences';

  @override
  String get prefOrders => 'Orders & requests';

  @override
  String get prefOrdersHint => 'Status changes on your requests and jobs';

  @override
  String get prefMessages => 'Messages';

  @override
  String get prefMessagesHint => 'New messages from customers and providers';

  @override
  String get prefPromotions => 'Offers & promotions';

  @override
  String get prefPromotionsHint => 'Discounts and news from SAHL';

  @override
  String get prefAccount => 'Account & security';

  @override
  String get prefAccountHint => 'Sign-ins, verification and account changes';

  @override
  String get helpSupport => 'Help & support';

  @override
  String get supportNewTicket => 'New support request';

  @override
  String get supportSubject => 'Subject';

  @override
  String get supportMessage => 'How can we help?';

  @override
  String get supportSend => 'Send';

  @override
  String get supportEmpty =>
      'No support requests yet. We\'re here if you need us.';

  @override
  String get supportReplyHint => 'Write a reply…';

  @override
  String get supportClosedNote => 'This request is closed.';

  @override
  String get ticketStatusOpen => 'Open';

  @override
  String get ticketStatusInProgress => 'In progress';

  @override
  String get ticketStatusResolved => 'Resolved';

  @override
  String get ticketStatusClosed => 'Closed';

  @override
  String get errorInvalidCurrentPassword =>
      'Your current password is incorrect.';

  @override
  String get errorPasswordUnchanged =>
      'Choose a password different from your current one.';

  @override
  String get errorAlreadyReviewed => 'You already reviewed this job.';

  @override
  String get errorJobNotCompleted =>
      'You can review a job once it\'s completed.';

  @override
  String get errorTicketClosed => 'This support request is closed.';

  @override
  String get errorProjectNotOpen => 'This project is no longer open.';

  @override
  String get validationDescriptionTooShort =>
      'Please add a few more details (at least 5 characters).';

  @override
  String get bookingScheduleInPast => 'Pick a time in the future.';

  @override
  String get openSettings => 'Open settings';

  @override
  String get contractStatusInProgress => 'In progress';

  @override
  String get contractStatusCompleted => 'Completed';

  @override
  String get contractStatusDisputed => 'In dispute';

  @override
  String get contractTotal => 'Contract total';

  @override
  String get viewContract => 'View contract';

  @override
  String get projectBudget => 'Budget';

  @override
  String get txTypeDeposit => 'Deposit';

  @override
  String get txTypeWithdrawal => 'Withdrawal';

  @override
  String get txTypeTransfer => 'Transfer';

  @override
  String get txTypeEscrowHold => 'Payment held';

  @override
  String get txTypeEscrowRelease => 'Payment released';

  @override
  String get txTypeRefund => 'Refund';

  @override
  String get txTypeCommission => 'Service fee';

  @override
  String get txTypeBonus => 'Bonus';

  @override
  String get txTypeCashback => 'Cashback';

  @override
  String get txTypeReward => 'Reward';

  @override
  String get txTypeAdjustment => 'Adjustment';

  @override
  String get txTypePenalty => 'Penalty';

  @override
  String get txTypePromotion => 'Promotion';

  @override
  String get txTypeTax => 'Tax';

  @override
  String get txTypeProcessingFee => 'Processing fee';

  @override
  String get walletFrozen => 'Your wallet is frozen. Contact support for help.';

  @override
  String get myListingsTitle => 'My posted services';

  @override
  String get myListingsEmpty =>
      'You haven\'t posted a service yet. Post one so customers can order it directly.';

  @override
  String get postServiceAction => 'Post a service';

  @override
  String get editServiceTitle => 'Edit service';

  @override
  String get listingStatusPending => 'Waiting for review';

  @override
  String get listingStatusPublished => 'Published';

  @override
  String get listingStatusRejected => 'Needs changes';

  @override
  String get listingStatusPaused => 'Paused';

  @override
  String listingRejectedReason(String reason) {
    return 'Reviewer\'s note: $reason';
  }

  @override
  String get listingCategory => 'Category';

  @override
  String get listingTitleLabel => 'Service title';

  @override
  String get listingTitleHint => 'e.g. I will design your company logo';

  @override
  String get listingDescriptionLabel => 'Description';

  @override
  String get listingDescriptionHint =>
      'What\'s included, what you need from the customer, and how you work';

  @override
  String get listingPriceLabel => 'Starting price';

  @override
  String get listingDeliveryLabel => 'Delivery (days)';

  @override
  String get listingCoverTitle => 'Cover image';

  @override
  String get listingCoverGuide =>
      'Use a landscape 16:9 image, ideally 1280×720 px (at least 800×450). JPG, PNG or WebP, up to 5 MB. Keep text and faces near the middle — the edges may be cropped on small cards.';

  @override
  String get listingCoverPick => 'Choose cover';

  @override
  String get listingCoverChange => 'Change cover';

  @override
  String get listingGalleryTitle => 'Gallery';

  @override
  String listingGalleryGuide(int max) {
    return 'Up to $max images of your work (same size rules as the cover).';
  }

  @override
  String get listingGalleryAdd => 'Add images';

  @override
  String get listingRemoveImage => 'Remove image';

  @override
  String get listingUploading => 'Uploading…';

  @override
  String get listingImageTooSmall =>
      'This image is too small. Use at least 800×450 px.';

  @override
  String get listingImageTooLarge => 'This image is larger than 5 MB.';

  @override
  String get listingImageNotLandscape =>
      'This image isn\'t landscape — it will be cropped to 16:9.';

  @override
  String get listingImageUnreadable =>
      'Couldn\'t read this image. Try another file.';

  @override
  String get listingUploadFailed =>
      'Upload failed. Check your connection and try again.';

  @override
  String get listingCoverRequired => 'Add a cover image.';

  @override
  String get listingUploadsOff =>
      'Image uploads aren\'t available yet, so services can\'t be posted right now.';

  @override
  String get listingSubmit => 'Send for review';

  @override
  String get listingReviewNote =>
      'SAHL reviews every new or edited service before customers can see it.';

  @override
  String get listingSubmitted =>
      'Sent for review. We\'ll notify you when it\'s live.';

  @override
  String get listingPause => 'Pause';

  @override
  String get listingResume => 'Resume';

  @override
  String get listingDelete => 'Delete';

  @override
  String get listingDeleteConfirm => 'Delete this service?';

  @override
  String get listingDeleteMessage =>
      'It will be removed for good, with its gallery.';

  @override
  String get listingEdit => 'Edit';

  @override
  String get listingsSectionTitle => 'Services you can order';

  @override
  String listingDeliveryDays(int days) {
    String _temp0 = intl.Intl.pluralLogic(
      days,
      locale: localeName,
      other: '$days-day delivery',
      one: '1-day delivery',
    );
    return '$_temp0';
  }

  @override
  String get listingOrderAction => 'Order this service';

  @override
  String get listingOrderConfirm => 'Order this service?';

  @override
  String listingOrderMessage(String title, String provider, String price) {
    return '“$title” from $provider, starting at $price. You can agree on milestones after ordering.';
  }

  @override
  String get listingQuoteAction => 'Request a project quote';

  @override
  String get listingAboutService => 'About this service';

  @override
  String get listingAboutProvider => 'About the provider';

  @override
  String get providerServicesListings => 'Posted services';

  @override
  String get errorListingNotEligible =>
      'Your provider profile must be verified before you can post services.';

  @override
  String get errorInvalidImage =>
      'One of the images wasn\'t uploaded through the app. Please add it again.';

  @override
  String get errorUploadsOff => 'Image uploads aren\'t available right now.';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get resetTitle => 'Reset your password';

  @override
  String get resetRequestSubtitle =>
      'Enter your phone number. SAHL support will contact you with a 6-digit code.';

  @override
  String get resetRequestButton => 'Send request';

  @override
  String get resetHaveCode => 'I already have a code';

  @override
  String get resetCodeTitle => 'Enter your code';

  @override
  String get resetRequestedMessage =>
      'Your request was sent. When SAHL support gives you the 6-digit code, enter it below with a new password. Codes are valid for 30 minutes.';

  @override
  String get resetCodeLabel => '6-digit code';

  @override
  String get resetConfirmPassword => 'Confirm new password';

  @override
  String get resetSubmit => 'Set new password';

  @override
  String get resetDone => 'Password changed. Sign in with your new password.';

  @override
  String get validationResetCode => 'Enter the 6-digit code';

  @override
  String get errorInvalidResetCode =>
      'The code is wrong or has expired. Check it, or ask for a new one.';

  @override
  String get errorTooManyAttempts =>
      'Too many wrong codes. Ask SAHL support for a new one.';
}
