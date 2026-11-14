import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// Brand name — never translated
  ///
  /// In en, this message translates to:
  /// **'SAHL'**
  String get appName;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get register;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumber;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// No description provided for @serviceTypeOnDemand.
  ///
  /// In en, this message translates to:
  /// **'On-Demand'**
  String get serviceTypeOnDemand;

  /// No description provided for @serviceTypeContract.
  ///
  /// In en, this message translates to:
  /// **'Contract'**
  String get serviceTypeContract;

  /// No description provided for @serviceTypeRemote.
  ///
  /// In en, this message translates to:
  /// **'Remote'**
  String get serviceTypeRemote;

  /// No description provided for @roleCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get roleCustomer;

  /// No description provided for @roleProvider.
  ///
  /// In en, this message translates to:
  /// **'Provider'**
  String get roleProvider;

  /// No description provided for @switchToProvider.
  ///
  /// In en, this message translates to:
  /// **'Switch to Provider'**
  String get switchToProvider;

  /// No description provided for @switchToCustomer.
  ///
  /// In en, this message translates to:
  /// **'Switch to Customer'**
  String get switchToCustomer;

  /// No description provided for @requestStatusSearching.
  ///
  /// In en, this message translates to:
  /// **'Finding a provider…'**
  String get requestStatusSearching;

  /// No description provided for @requestStatusAssigned.
  ///
  /// In en, this message translates to:
  /// **'Provider assigned'**
  String get requestStatusAssigned;

  /// No description provided for @requestStatusEnRoute.
  ///
  /// In en, this message translates to:
  /// **'Provider en route'**
  String get requestStatusEnRoute;

  /// No description provided for @requestStatusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get requestStatusInProgress;

  /// No description provided for @requestStatusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get requestStatusCompleted;

  /// No description provided for @requestStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get requestStatusCancelled;

  /// No description provided for @errorGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get errorGeneric;

  /// No description provided for @errorNoConnection.
  ///
  /// In en, this message translates to:
  /// **'No internet connection.'**
  String get errorNoConnection;

  /// No description provided for @errorTimeout.
  ///
  /// In en, this message translates to:
  /// **'The request took too long. Please try again.'**
  String get errorTimeout;

  /// No description provided for @errorServerUnavailable.
  ///
  /// In en, this message translates to:
  /// **'The server is temporarily unavailable. Please try again shortly.'**
  String get errorServerUnavailable;

  /// No description provided for @errorValidation.
  ///
  /// In en, this message translates to:
  /// **'Please check the information you entered.'**
  String get errorValidation;

  /// No description provided for @errorSessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired. Please log in again.'**
  String get errorSessionExpired;

  /// No description provided for @errorForbidden.
  ///
  /// In en, this message translates to:
  /// **'You don\'t have permission to do that.'**
  String get errorForbidden;

  /// No description provided for @errorNotFound.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t find what you\'re looking for.'**
  String get errorNotFound;

  /// No description provided for @errorConflict.
  ///
  /// In en, this message translates to:
  /// **'This action can\'t be completed right now.'**
  String get errorConflict;

  /// No description provided for @errorTooManyRequests.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please wait a moment and try again.'**
  String get errorTooManyRequests;

  /// No description provided for @errorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Incorrect phone number or password.'**
  String get errorInvalidCredentials;

  /// No description provided for @errorAccountNotActive.
  ///
  /// In en, this message translates to:
  /// **'This account isn\'t active. Please contact support.'**
  String get errorAccountNotActive;

  /// No description provided for @errorUserNotFound.
  ///
  /// In en, this message translates to:
  /// **'No account was found with that phone number.'**
  String get errorUserNotFound;

  /// No description provided for @errorPhoneAlreadyRegistered.
  ///
  /// In en, this message translates to:
  /// **'An account with this phone number already exists.'**
  String get errorPhoneAlreadyRegistered;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @validationRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get validationRequired;

  /// No description provided for @validationPhoneInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid phone number'**
  String get validationPhoneInvalid;

  /// No description provided for @validationPasswordTooShort.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get validationPasswordTooShort;

  /// No description provided for @validationFullNameTooShort.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get validationFullNameTooShort;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'SAHL connects you with the services you need'**
  String get loginSubtitle;

  /// No description provided for @registerTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'It only takes a minute'**
  String get registerSubtitle;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @homePlaceholderTitle.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get homePlaceholderTitle;

  /// No description provided for @loggedInAs.
  ///
  /// In en, this message translates to:
  /// **'Logged in as {name}'**
  String loggedInAs(String name);

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logout;

  /// No description provided for @sessionRestoring.
  ///
  /// In en, this message translates to:
  /// **'Restoring your session…'**
  String get sessionRestoring;

  /// No description provided for @homeGreeting.
  ///
  /// In en, this message translates to:
  /// **'Hi, {name}'**
  String homeGreeting(String name);

  /// No description provided for @homeNoContent.
  ///
  /// In en, this message translates to:
  /// **'Nothing to show here yet — check back soon.'**
  String get homeNoContent;

  /// No description provided for @availabilityLabel.
  ///
  /// In en, this message translates to:
  /// **'Availability'**
  String get availabilityLabel;

  /// No description provided for @availabilityOnline.
  ///
  /// In en, this message translates to:
  /// **'Available for jobs'**
  String get availabilityOnline;

  /// No description provided for @availabilityOffline.
  ///
  /// In en, this message translates to:
  /// **'Not available'**
  String get availabilityOffline;

  /// No description provided for @availabilityVacation.
  ///
  /// In en, this message translates to:
  /// **'On vacation'**
  String get availabilityVacation;

  /// No description provided for @availabilityTemporarilyUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Temporarily unavailable'**
  String get availabilityTemporarilyUnavailable;

  /// No description provided for @availabilityEmergencyOffline.
  ///
  /// In en, this message translates to:
  /// **'Offline (emergency)'**
  String get availabilityEmergencyOffline;

  /// No description provided for @providerJobsCompleted.
  ///
  /// In en, this message translates to:
  /// **'{count} jobs completed'**
  String providerJobsCompleted(int count);

  /// No description provided for @companyDashboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get companyDashboardTitle;

  /// No description provided for @companyVerificationStatus.
  ///
  /// In en, this message translates to:
  /// **'Verification: {status}'**
  String companyVerificationStatus(String status);

  /// No description provided for @onDemandRequestDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Request Details'**
  String get onDemandRequestDetailsTitle;

  /// No description provided for @onDemandMyRequests.
  ///
  /// In en, this message translates to:
  /// **'My Requests'**
  String get onDemandMyRequests;

  /// No description provided for @onDemandNewRequest.
  ///
  /// In en, this message translates to:
  /// **'New Request'**
  String get onDemandNewRequest;

  /// No description provided for @onDemandCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get onDemandCategory;

  /// No description provided for @onDemandDescription.
  ///
  /// In en, this message translates to:
  /// **'What do you need?'**
  String get onDemandDescription;

  /// No description provided for @onDemandLatitude.
  ///
  /// In en, this message translates to:
  /// **'Latitude'**
  String get onDemandLatitude;

  /// No description provided for @onDemandLongitude.
  ///
  /// In en, this message translates to:
  /// **'Longitude'**
  String get onDemandLongitude;

  /// No description provided for @onDemandLocationHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your location coordinates'**
  String get onDemandLocationHint;

  /// No description provided for @onDemandEmergency.
  ///
  /// In en, this message translates to:
  /// **'This is an emergency'**
  String get onDemandEmergency;

  /// No description provided for @onDemandSubmit.
  ///
  /// In en, this message translates to:
  /// **'Request Service'**
  String get onDemandSubmit;

  /// No description provided for @onDemandCancelRequest.
  ///
  /// In en, this message translates to:
  /// **'Cancel Request'**
  String get onDemandCancelRequest;

  /// No description provided for @onDemandCancelConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Cancel this request?'**
  String get onDemandCancelConfirmTitle;

  /// No description provided for @onDemandCancelConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'This can\'t be undone.'**
  String get onDemandCancelConfirmBody;

  /// No description provided for @onDemandNoRequests.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t requested any services yet.'**
  String get onDemandNoRequests;

  /// No description provided for @onDemandJobOffers.
  ///
  /// In en, this message translates to:
  /// **'Job Offers'**
  String get onDemandJobOffers;

  /// No description provided for @onDemandAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get onDemandAccept;

  /// No description provided for @onDemandDecline.
  ///
  /// In en, this message translates to:
  /// **'Decline'**
  String get onDemandDecline;

  /// No description provided for @onDemandNoOffers.
  ///
  /// In en, this message translates to:
  /// **'No job offers right now.'**
  String get onDemandNoOffers;

  /// No description provided for @onDemandQuotedPrice.
  ///
  /// In en, this message translates to:
  /// **'Quoted: {amount}'**
  String onDemandQuotedPrice(String amount);

  /// No description provided for @onDemandEmergencyBadge.
  ///
  /// In en, this message translates to:
  /// **'Emergency'**
  String get onDemandEmergencyBadge;

  /// No description provided for @contractMyProjects.
  ///
  /// In en, this message translates to:
  /// **'My Projects'**
  String get contractMyProjects;

  /// No description provided for @contractBrowseProjects.
  ///
  /// In en, this message translates to:
  /// **'Browse Projects'**
  String get contractBrowseProjects;

  /// No description provided for @contractMyBids.
  ///
  /// In en, this message translates to:
  /// **'My Bids'**
  String get contractMyBids;

  /// No description provided for @contractNewProject.
  ///
  /// In en, this message translates to:
  /// **'New Project'**
  String get contractNewProject;

  /// No description provided for @contractTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get contractTitle;

  /// No description provided for @contractDescription.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get contractDescription;

  /// No description provided for @contractCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get contractCategory;

  /// No description provided for @contractBudgetMin.
  ///
  /// In en, this message translates to:
  /// **'Budget min (optional)'**
  String get contractBudgetMin;

  /// No description provided for @contractBudgetMax.
  ///
  /// In en, this message translates to:
  /// **'Budget max (optional)'**
  String get contractBudgetMax;

  /// No description provided for @contractSubmit.
  ///
  /// In en, this message translates to:
  /// **'Post Project'**
  String get contractSubmit;

  /// No description provided for @contractNoProjects.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t posted any projects yet.'**
  String get contractNoProjects;

  /// No description provided for @contractNoOpenProjects.
  ///
  /// In en, this message translates to:
  /// **'No open projects right now.'**
  String get contractNoOpenProjects;

  /// No description provided for @contractNoBids.
  ///
  /// In en, this message translates to:
  /// **'No bids yet.'**
  String get contractNoBids;

  /// No description provided for @contractSubmitBid.
  ///
  /// In en, this message translates to:
  /// **'Submit Bid'**
  String get contractSubmitBid;

  /// No description provided for @contractBidAmount.
  ///
  /// In en, this message translates to:
  /// **'Your bid amount'**
  String get contractBidAmount;

  /// No description provided for @contractBidMessage.
  ///
  /// In en, this message translates to:
  /// **'Message (optional)'**
  String get contractBidMessage;

  /// No description provided for @contractWithdrawBid.
  ///
  /// In en, this message translates to:
  /// **'Withdraw Bid'**
  String get contractWithdrawBid;

  /// No description provided for @contractAwardBid.
  ///
  /// In en, this message translates to:
  /// **'Award This Bid'**
  String get contractAwardBid;

  /// No description provided for @contractStatusOpenForBids.
  ///
  /// In en, this message translates to:
  /// **'Open for bids'**
  String get contractStatusOpenForBids;

  /// No description provided for @contractStatusAwarded.
  ///
  /// In en, this message translates to:
  /// **'Awarded'**
  String get contractStatusAwarded;

  /// No description provided for @contractStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get contractStatusCancelled;

  /// No description provided for @contractBidStatusSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted'**
  String get contractBidStatusSubmitted;

  /// No description provided for @contractBidStatusAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get contractBidStatusAccepted;

  /// No description provided for @contractBidStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get contractBidStatusRejected;

  /// No description provided for @contractBidStatusWithdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get contractBidStatusWithdrawn;

  /// No description provided for @contractMilestones.
  ///
  /// In en, this message translates to:
  /// **'Milestones'**
  String get contractMilestones;

  /// No description provided for @contractNewMilestone.
  ///
  /// In en, this message translates to:
  /// **'New Milestone'**
  String get contractNewMilestone;

  /// No description provided for @contractMilestoneTitle.
  ///
  /// In en, this message translates to:
  /// **'Milestone title'**
  String get contractMilestoneTitle;

  /// No description provided for @contractMilestoneAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get contractMilestoneAmount;

  /// No description provided for @contractNoMilestones.
  ///
  /// In en, this message translates to:
  /// **'No milestones yet.'**
  String get contractNoMilestones;

  /// No description provided for @contractDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Project Details'**
  String get contractDetailsTitle;

  /// No description provided for @remoteMyEngagements.
  ///
  /// In en, this message translates to:
  /// **'My Engagements'**
  String get remoteMyEngagements;

  /// No description provided for @remoteMyBookings.
  ///
  /// In en, this message translates to:
  /// **'My Bookings'**
  String get remoteMyBookings;

  /// No description provided for @remoteNewEngagement.
  ///
  /// In en, this message translates to:
  /// **'New Engagement'**
  String get remoteNewEngagement;

  /// No description provided for @remoteTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get remoteTitle;

  /// No description provided for @remoteCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get remoteCategory;

  /// No description provided for @remoteSelectCategoryFirst.
  ///
  /// In en, this message translates to:
  /// **'Choose a category to see available providers'**
  String get remoteSelectCategoryFirst;

  /// No description provided for @remoteProvider.
  ///
  /// In en, this message translates to:
  /// **'Provider'**
  String get remoteProvider;

  /// No description provided for @remoteNoProvidersForCategory.
  ///
  /// In en, this message translates to:
  /// **'No providers available for this category yet.'**
  String get remoteNoProvidersForCategory;

  /// No description provided for @remotePriceType.
  ///
  /// In en, this message translates to:
  /// **'Price type'**
  String get remotePriceType;

  /// No description provided for @remotePriceFixed.
  ///
  /// In en, this message translates to:
  /// **'Fixed price'**
  String get remotePriceFixed;

  /// No description provided for @remotePriceHourly.
  ///
  /// In en, this message translates to:
  /// **'Hourly rate'**
  String get remotePriceHourly;

  /// No description provided for @remoteAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get remoteAmount;

  /// No description provided for @remoteSubmit.
  ///
  /// In en, this message translates to:
  /// **'Hire Provider'**
  String get remoteSubmit;

  /// No description provided for @remoteNoEngagements.
  ///
  /// In en, this message translates to:
  /// **'No engagements yet.'**
  String get remoteNoEngagements;

  /// No description provided for @remoteStatusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get remoteStatusActive;

  /// No description provided for @remoteStatusDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get remoteStatusDelivered;

  /// No description provided for @remoteStatusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get remoteStatusCompleted;

  /// No description provided for @remoteStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get remoteStatusCancelled;

  /// No description provided for @remoteDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Engagement Details'**
  String get remoteDetailsTitle;

  /// No description provided for @remoteMilestones.
  ///
  /// In en, this message translates to:
  /// **'Milestones'**
  String get remoteMilestones;

  /// No description provided for @remoteNewMilestone.
  ///
  /// In en, this message translates to:
  /// **'New Milestone'**
  String get remoteNewMilestone;

  /// No description provided for @remoteNoMilestones.
  ///
  /// In en, this message translates to:
  /// **'No milestones yet.'**
  String get remoteNoMilestones;

  /// No description provided for @walletTitle.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get walletTitle;

  /// No description provided for @walletAvailableBalance.
  ///
  /// In en, this message translates to:
  /// **'Available balance'**
  String get walletAvailableBalance;

  /// No description provided for @walletTransactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get walletTransactions;

  /// No description provided for @walletNoTransactions.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet.'**
  String get walletNoTransactions;

  /// No description provided for @walletWithdrawals.
  ///
  /// In en, this message translates to:
  /// **'Withdrawals'**
  String get walletWithdrawals;

  /// No description provided for @walletRequestWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Request Withdrawal'**
  String get walletRequestWithdrawal;

  /// No description provided for @walletWithdrawalAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get walletWithdrawalAmount;

  /// No description provided for @walletWithdrawalMethod.
  ///
  /// In en, this message translates to:
  /// **'Payout method'**
  String get walletWithdrawalMethod;

  /// No description provided for @walletMethodBankTransfer.
  ///
  /// In en, this message translates to:
  /// **'Bank transfer'**
  String get walletMethodBankTransfer;

  /// No description provided for @walletMethodWalletTransfer.
  ///
  /// In en, this message translates to:
  /// **'Wallet transfer'**
  String get walletMethodWalletTransfer;

  /// No description provided for @walletMethodMobileMoney.
  ///
  /// In en, this message translates to:
  /// **'Mobile money'**
  String get walletMethodMobileMoney;

  /// No description provided for @walletNoWithdrawals.
  ///
  /// In en, this message translates to:
  /// **'No withdrawal requests yet.'**
  String get walletNoWithdrawals;

  /// No description provided for @walletSubmitWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Submit Request'**
  String get walletSubmitWithdrawal;

  /// No description provided for @withdrawalStatusRequested.
  ///
  /// In en, this message translates to:
  /// **'Requested'**
  String get withdrawalStatusRequested;

  /// No description provided for @withdrawalStatusPendingApproval.
  ///
  /// In en, this message translates to:
  /// **'Pending approval'**
  String get withdrawalStatusPendingApproval;

  /// No description provided for @withdrawalStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get withdrawalStatusApproved;

  /// No description provided for @withdrawalStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get withdrawalStatusRejected;

  /// No description provided for @withdrawalStatusProcessing.
  ///
  /// In en, this message translates to:
  /// **'Processing'**
  String get withdrawalStatusProcessing;

  /// No description provided for @withdrawalStatusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get withdrawalStatusPaid;

  /// No description provided for @withdrawalStatusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get withdrawalStatusFailed;

  /// No description provided for @disputeMyDisputes.
  ///
  /// In en, this message translates to:
  /// **'My Disputes'**
  String get disputeMyDisputes;

  /// No description provided for @disputeNoDisputes.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t opened any disputes.'**
  String get disputeNoDisputes;

  /// No description provided for @disputeOpenAction.
  ///
  /// In en, this message translates to:
  /// **'Open Dispute'**
  String get disputeOpenAction;

  /// No description provided for @disputeReason.
  ///
  /// In en, this message translates to:
  /// **'What went wrong?'**
  String get disputeReason;

  /// No description provided for @disputeSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit Dispute'**
  String get disputeSubmit;

  /// No description provided for @disputeStatusOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get disputeStatusOpen;

  /// No description provided for @disputeStatusUnderReview.
  ///
  /// In en, this message translates to:
  /// **'Under review'**
  String get disputeStatusUnderReview;

  /// No description provided for @disputeStatusResolved.
  ///
  /// In en, this message translates to:
  /// **'Resolved'**
  String get disputeStatusResolved;

  /// No description provided for @disputeStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get disputeStatusRejected;

  /// No description provided for @disputeResolutionNotes.
  ///
  /// In en, this message translates to:
  /// **'Resolution: {notes}'**
  String disputeResolutionNotes(String notes);

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @notificationsMarkAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get notificationsMarkAllRead;

  /// No description provided for @notificationsNoNotifications.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet.'**
  String get notificationsNoNotifications;

  /// No description provided for @companyMembersTitle.
  ///
  /// In en, this message translates to:
  /// **'Members'**
  String get companyMembersTitle;

  /// No description provided for @companyPendingInvitations.
  ///
  /// In en, this message translates to:
  /// **'Pending Invitations'**
  String get companyPendingInvitations;

  /// No description provided for @companyNoMembers.
  ///
  /// In en, this message translates to:
  /// **'No members yet.'**
  String get companyNoMembers;

  /// No description provided for @companyNoPendingInvitations.
  ///
  /// In en, this message translates to:
  /// **'No pending invitations.'**
  String get companyNoPendingInvitations;

  /// No description provided for @companyInviteMember.
  ///
  /// In en, this message translates to:
  /// **'Invite Member'**
  String get companyInviteMember;

  /// No description provided for @companyInvitedPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get companyInvitedPhone;

  /// No description provided for @companyRole.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get companyRole;

  /// No description provided for @companyRoleOwner.
  ///
  /// In en, this message translates to:
  /// **'Owner'**
  String get companyRoleOwner;

  /// No description provided for @companyRoleManager.
  ///
  /// In en, this message translates to:
  /// **'Manager'**
  String get companyRoleManager;

  /// No description provided for @companyRoleStaff.
  ///
  /// In en, this message translates to:
  /// **'Staff'**
  String get companyRoleStaff;

  /// No description provided for @companySendInvite.
  ///
  /// In en, this message translates to:
  /// **'Send Invite'**
  String get companySendInvite;

  /// No description provided for @companyRemoveMember.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get companyRemoveMember;

  /// No description provided for @companyRemoveMemberConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Remove this member?'**
  String get companyRemoveMemberConfirmTitle;

  /// No description provided for @companyRemoveMemberConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'They will lose access to this company.'**
  String get companyRemoveMemberConfirmBody;

  /// No description provided for @companyCancelInvitation.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get companyCancelInvitation;

  /// No description provided for @companyInvitationStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get companyInvitationStatusPending;

  /// No description provided for @companyInvitationStatusAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get companyInvitationStatusAccepted;

  /// No description provided for @companyInvitationStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get companyInvitationStatusRejected;

  /// No description provided for @companyInvitationStatusExpired.
  ///
  /// In en, this message translates to:
  /// **'Expired'**
  String get companyInvitationStatusExpired;

  /// No description provided for @companyInvitationStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get companyInvitationStatusCancelled;

  /// No description provided for @companyDocumentsTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification Documents'**
  String get companyDocumentsTitle;

  /// No description provided for @companyNoDocuments.
  ///
  /// In en, this message translates to:
  /// **'No documents uploaded yet.'**
  String get companyNoDocuments;

  /// No description provided for @companyAddDocument.
  ///
  /// In en, this message translates to:
  /// **'Add Document'**
  String get companyAddDocument;

  /// No description provided for @companyDocumentType.
  ///
  /// In en, this message translates to:
  /// **'Document type'**
  String get companyDocumentType;

  /// No description provided for @companyDocumentFileUrl.
  ///
  /// In en, this message translates to:
  /// **'File URL'**
  String get companyDocumentFileUrl;

  /// No description provided for @companyDocumentStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending review'**
  String get companyDocumentStatusPending;

  /// No description provided for @companyDocumentStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get companyDocumentStatusApproved;

  /// No description provided for @companyDocumentStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get companyDocumentStatusRejected;

  /// No description provided for @companySubmitVerification.
  ///
  /// In en, this message translates to:
  /// **'Submit for Verification'**
  String get companySubmitVerification;

  /// No description provided for @companyVerificationSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted for review.'**
  String get companyVerificationSubmitted;

  /// No description provided for @companyMyInvitationsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Invitations'**
  String get companyMyInvitationsTitle;

  /// No description provided for @companyNoInvitations.
  ///
  /// In en, this message translates to:
  /// **'You have no pending invitations.'**
  String get companyNoInvitations;

  /// No description provided for @companyInvitedToJoin.
  ///
  /// In en, this message translates to:
  /// **'Invited to join {companyName} as {role}'**
  String companyInvitedToJoin(String companyName, String role);

  /// No description provided for @companyAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get companyAccept;

  /// No description provided for @providerProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'Provider Profile'**
  String get providerProfileTitle;

  /// No description provided for @providerEditProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get providerEditProfile;

  /// No description provided for @providerBusinessName.
  ///
  /// In en, this message translates to:
  /// **'Business name'**
  String get providerBusinessName;

  /// No description provided for @providerBio.
  ///
  /// In en, this message translates to:
  /// **'Bio'**
  String get providerBio;

  /// No description provided for @providerYearsOfExperience.
  ///
  /// In en, this message translates to:
  /// **'Years of experience'**
  String get providerYearsOfExperience;

  /// No description provided for @providerSkills.
  ///
  /// In en, this message translates to:
  /// **'Skills (comma-separated)'**
  String get providerSkills;

  /// No description provided for @providerTravelDistanceKm.
  ///
  /// In en, this message translates to:
  /// **'Travel distance (km)'**
  String get providerTravelDistanceKm;

  /// No description provided for @providerRemoteAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available for remote work'**
  String get providerRemoteAvailable;

  /// No description provided for @providerEmergencyAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available for emergency jobs'**
  String get providerEmergencyAvailable;

  /// No description provided for @providerEmergencyContactName.
  ///
  /// In en, this message translates to:
  /// **'Emergency contact name'**
  String get providerEmergencyContactName;

  /// No description provided for @providerEmergencyContactPhone.
  ///
  /// In en, this message translates to:
  /// **'Emergency contact phone'**
  String get providerEmergencyContactPhone;

  /// No description provided for @providerSaveProfile.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get providerSaveProfile;

  /// No description provided for @providerDocumentsTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification Documents'**
  String get providerDocumentsTitle;

  /// No description provided for @providerNoDocuments.
  ///
  /// In en, this message translates to:
  /// **'No documents uploaded yet.'**
  String get providerNoDocuments;

  /// No description provided for @providerAddDocument.
  ///
  /// In en, this message translates to:
  /// **'Add Document'**
  String get providerAddDocument;

  /// No description provided for @providerDocumentType.
  ///
  /// In en, this message translates to:
  /// **'Document type'**
  String get providerDocumentType;

  /// No description provided for @providerDocumentFileUrl.
  ///
  /// In en, this message translates to:
  /// **'File URL'**
  String get providerDocumentFileUrl;

  /// No description provided for @providerDocumentStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending review'**
  String get providerDocumentStatusPending;

  /// No description provided for @providerDocumentStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get providerDocumentStatusApproved;

  /// No description provided for @providerDocumentStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get providerDocumentStatusRejected;

  /// No description provided for @providerSubmitVerification.
  ///
  /// In en, this message translates to:
  /// **'Submit for Verification'**
  String get providerSubmitVerification;

  /// No description provided for @providerVerificationSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted for review.'**
  String get providerVerificationSubmitted;

  /// No description provided for @providerPortfolioTitle.
  ///
  /// In en, this message translates to:
  /// **'Portfolio'**
  String get providerPortfolioTitle;

  /// No description provided for @providerNoPortfolioItems.
  ///
  /// In en, this message translates to:
  /// **'No portfolio items yet.'**
  String get providerNoPortfolioItems;

  /// No description provided for @providerAddPortfolioItem.
  ///
  /// In en, this message translates to:
  /// **'Add Item'**
  String get providerAddPortfolioItem;

  /// No description provided for @providerPortfolioMediaUrl.
  ///
  /// In en, this message translates to:
  /// **'Media URL'**
  String get providerPortfolioMediaUrl;

  /// No description provided for @providerPortfolioItemTitle.
  ///
  /// In en, this message translates to:
  /// **'Title (optional)'**
  String get providerPortfolioItemTitle;

  /// No description provided for @providerPortfolioItemDescription.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get providerPortfolioItemDescription;

  /// No description provided for @providerDeleteItem.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get providerDeleteItem;

  /// No description provided for @providerPayoutAccountsTitle.
  ///
  /// In en, this message translates to:
  /// **'Payout Accounts'**
  String get providerPayoutAccountsTitle;

  /// No description provided for @providerNoPayoutAccounts.
  ///
  /// In en, this message translates to:
  /// **'No payout accounts yet.'**
  String get providerNoPayoutAccounts;

  /// No description provided for @providerAddPayoutAccount.
  ///
  /// In en, this message translates to:
  /// **'Add Payout Account'**
  String get providerAddPayoutAccount;

  /// No description provided for @providerSetDefault.
  ///
  /// In en, this message translates to:
  /// **'Set as default'**
  String get providerSetDefault;

  /// No description provided for @providerDefaultBadge.
  ///
  /// In en, this message translates to:
  /// **'Default'**
  String get providerDefaultBadge;

  /// No description provided for @providerBankName.
  ///
  /// In en, this message translates to:
  /// **'Bank name'**
  String get providerBankName;

  /// No description provided for @providerAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account number'**
  String get providerAccountNumber;

  /// No description provided for @providerAccountHolderName.
  ///
  /// In en, this message translates to:
  /// **'Account holder name'**
  String get providerAccountHolderName;

  /// No description provided for @providerWalletPhone.
  ///
  /// In en, this message translates to:
  /// **'Wallet phone number'**
  String get providerWalletPhone;

  /// No description provided for @providerMobileMoneyProvider.
  ///
  /// In en, this message translates to:
  /// **'Mobile money provider'**
  String get providerMobileMoneyProvider;

  /// No description provided for @providerPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get providerPhoneNumber;

  /// No description provided for @onboardingTitle1.
  ///
  /// In en, this message translates to:
  /// **'All your services'**
  String get onboardingTitle1;

  /// No description provided for @onboardingHighlight1.
  ///
  /// In en, this message translates to:
  /// **'in one place'**
  String get onboardingHighlight1;

  /// No description provided for @onboardingBody1.
  ///
  /// In en, this message translates to:
  /// **'From instant jobs to long-term projects — simply and safely'**
  String get onboardingBody1;

  /// No description provided for @onboardingTitle2.
  ///
  /// In en, this message translates to:
  /// **'Trusted providers'**
  String get onboardingTitle2;

  /// No description provided for @onboardingHighlight2.
  ///
  /// In en, this message translates to:
  /// **'near you'**
  String get onboardingHighlight2;

  /// No description provided for @onboardingBody2.
  ///
  /// In en, this message translates to:
  /// **'Every provider is reviewed before joining SAHL'**
  String get onboardingBody2;

  /// No description provided for @onboardingTitle3.
  ///
  /// In en, this message translates to:
  /// **'Pay safely'**
  String get onboardingTitle3;

  /// No description provided for @onboardingHighlight3.
  ///
  /// In en, this message translates to:
  /// **'track every step'**
  String get onboardingHighlight3;

  /// No description provided for @onboardingBody3.
  ///
  /// In en, this message translates to:
  /// **'Your payment is held until the job is done and approved'**
  String get onboardingBody3;

  /// No description provided for @alreadyHaveAccountLogin.
  ///
  /// In en, this message translates to:
  /// **'I already have an account'**
  String get alreadyHaveAccountLogin;

  /// No description provided for @switchLanguage.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get switchLanguage;

  /// No description provided for @showPassword.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get showPassword;

  /// No description provided for @hidePassword.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get hidePassword;

  /// No description provided for @createAccountLink.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccountLink;

  /// No description provided for @registerChooseTitle.
  ///
  /// In en, this message translates to:
  /// **'Create a new account'**
  String get registerChooseTitle;

  /// No description provided for @registerChooseSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose an account type to continue'**
  String get registerChooseSubtitle;

  /// No description provided for @accountTypeCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get accountTypeCustomer;

  /// No description provided for @accountTypeCustomerHint.
  ///
  /// In en, this message translates to:
  /// **'Request services easily'**
  String get accountTypeCustomerHint;

  /// No description provided for @accountTypeProvider.
  ///
  /// In en, this message translates to:
  /// **'Service provider'**
  String get accountTypeProvider;

  /// No description provided for @accountTypeProviderHint.
  ///
  /// In en, this message translates to:
  /// **'Offer your services and earn'**
  String get accountTypeProviderHint;

  /// No description provided for @accountTypeCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get accountTypeCompany;

  /// No description provided for @accountTypeCompanyHint.
  ///
  /// In en, this message translates to:
  /// **'Manage your company\'s services'**
  String get accountTypeCompanyHint;

  /// No description provided for @continueAction.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueAction;

  /// No description provided for @registerDetailsTitleCustomer.
  ///
  /// In en, this message translates to:
  /// **'Create a customer account'**
  String get registerDetailsTitleCustomer;

  /// No description provided for @registerDetailsTitleProvider.
  ///
  /// In en, this message translates to:
  /// **'Create a provider account'**
  String get registerDetailsTitleProvider;

  /// No description provided for @registerDetailsTitleCompany.
  ///
  /// In en, this message translates to:
  /// **'Create a company account'**
  String get registerDetailsTitleCompany;

  /// No description provided for @registerDetailsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your details to continue'**
  String get registerDetailsSubtitle;

  /// No description provided for @emailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email (optional)'**
  String get emailOptional;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @businessName.
  ///
  /// In en, this message translates to:
  /// **'Business name'**
  String get businessName;

  /// No description provided for @companyName.
  ///
  /// In en, this message translates to:
  /// **'Company name'**
  String get companyName;

  /// No description provided for @validationPasswordsDontMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords don\'t match'**
  String get validationPasswordsDontMatch;

  /// No description provided for @validationEmailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get validationEmailInvalid;

  /// No description provided for @termsNotice.
  ///
  /// In en, this message translates to:
  /// **'By continuing, you agree to SAHL\'s Terms & Conditions'**
  String get termsNotice;

  /// No description provided for @registerSuccessTitle.
  ///
  /// In en, this message translates to:
  /// **'Your account was created!'**
  String get registerSuccessTitle;

  /// No description provided for @registerPendingBody.
  ///
  /// In en, this message translates to:
  /// **'We\'re reviewing your account. You can log in as soon as an administrator approves it.'**
  String get registerPendingBody;

  /// No description provided for @backToLogin.
  ///
  /// In en, this message translates to:
  /// **'Back to log in'**
  String get backToLogin;

  /// No description provided for @errorAccountPendingApproval.
  ///
  /// In en, this message translates to:
  /// **'Your account is waiting for admin approval. You can log in once it\'s approved.'**
  String get errorAccountPendingApproval;

  /// No description provided for @errorEmailAlreadyRegistered.
  ///
  /// In en, this message translates to:
  /// **'An account with this email already exists.'**
  String get errorEmailAlreadyRegistered;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
