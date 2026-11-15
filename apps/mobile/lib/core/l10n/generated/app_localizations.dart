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
  /// **'Incorrect email/phone or password.'**
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

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navExplore.
  ///
  /// In en, this message translates to:
  /// **'Explore'**
  String get navExplore;

  /// No description provided for @navRequests.
  ///
  /// In en, this message translates to:
  /// **'Requests'**
  String get navRequests;

  /// No description provided for @navWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get navWallet;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @navDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get navDashboard;

  /// No description provided for @navJobs.
  ///
  /// In en, this message translates to:
  /// **'Jobs'**
  String get navJobs;

  /// No description provided for @navServices.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get navServices;

  /// No description provided for @navEarnings.
  ///
  /// In en, this message translates to:
  /// **'Earnings'**
  String get navEarnings;

  /// No description provided for @navTeam.
  ///
  /// In en, this message translates to:
  /// **'Team'**
  String get navTeam;

  /// No description provided for @navFinance.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get navFinance;

  /// No description provided for @roleCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get roleCompany;

  /// No description provided for @homeSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search for a service…'**
  String get homeSearchHint;

  /// No description provided for @homeServiceTypesTitle.
  ///
  /// In en, this message translates to:
  /// **'What do you need today?'**
  String get homeServiceTypesTitle;

  /// No description provided for @homeForYou.
  ///
  /// In en, this message translates to:
  /// **'For you'**
  String get homeForYou;

  /// No description provided for @serviceTypeShortTerm.
  ///
  /// In en, this message translates to:
  /// **'Short-Term'**
  String get serviceTypeShortTerm;

  /// No description provided for @serviceTypeLongTerm.
  ///
  /// In en, this message translates to:
  /// **'Long-Term'**
  String get serviceTypeLongTerm;

  /// No description provided for @serviceTypeOnDemandHint.
  ///
  /// In en, this message translates to:
  /// **'Fast help, right now'**
  String get serviceTypeOnDemandHint;

  /// No description provided for @serviceTypeShortTermHint.
  ///
  /// In en, this message translates to:
  /// **'Remote tasks & short projects'**
  String get serviceTypeShortTermHint;

  /// No description provided for @serviceTypeLongTermHint.
  ///
  /// In en, this message translates to:
  /// **'Contracts & big projects'**
  String get serviceTypeLongTermHint;

  /// No description provided for @exploreTitle.
  ///
  /// In en, this message translates to:
  /// **'Explore services'**
  String get exploreTitle;

  /// No description provided for @exploreEmpty.
  ///
  /// In en, this message translates to:
  /// **'No services in this category yet.'**
  String get exploreEmpty;

  /// No description provided for @exploreRequestAction.
  ///
  /// In en, this message translates to:
  /// **'View details'**
  String get exploreRequestAction;

  /// No description provided for @requestsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Requests'**
  String get requestsTitle;

  /// No description provided for @requestsOnDemandSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Instant jobs you requested'**
  String get requestsOnDemandSubtitle;

  /// No description provided for @requestsShortTermSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Remote work you booked'**
  String get requestsShortTermSubtitle;

  /// No description provided for @requestsLongTermSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Projects, bids and contracts'**
  String get requestsLongTermSubtitle;

  /// No description provided for @requestsDisputesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Problems you reported'**
  String get requestsDisputesSubtitle;

  /// No description provided for @providerStatRating.
  ///
  /// In en, this message translates to:
  /// **'Rating'**
  String get providerStatRating;

  /// No description provided for @providerStatCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed jobs'**
  String get providerStatCompleted;

  /// No description provided for @providerStatBalance.
  ///
  /// In en, this message translates to:
  /// **'Available balance'**
  String get providerStatBalance;

  /// No description provided for @jobsTitle.
  ///
  /// In en, this message translates to:
  /// **'Jobs'**
  String get jobsTitle;

  /// No description provided for @jobsOffersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'New on-demand requests sent to you'**
  String get jobsOffersSubtitle;

  /// No description provided for @jobsBookingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Short-term work customers booked'**
  String get jobsBookingsSubtitle;

  /// No description provided for @jobsBidsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your offers on long-term projects'**
  String get jobsBidsSubtitle;

  /// No description provided for @jobsBrowseSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Find long-term projects to bid on'**
  String get jobsBrowseSubtitle;

  /// No description provided for @servicesTitle.
  ///
  /// In en, this message translates to:
  /// **'My Services'**
  String get servicesTitle;

  /// No description provided for @servicesPortfolioSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Show customers your best work'**
  String get servicesPortfolioSubtitle;

  /// No description provided for @servicesVerificationSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Documents that verify your account'**
  String get servicesVerificationSubtitle;

  /// No description provided for @servicesProfileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Business name, bio, skills'**
  String get servicesProfileSubtitle;

  /// No description provided for @companyStatMembers.
  ///
  /// In en, this message translates to:
  /// **'Team members'**
  String get companyStatMembers;

  /// No description provided for @companyStatPendingInvites.
  ///
  /// In en, this message translates to:
  /// **'Pending invitations'**
  String get companyStatPendingInvites;

  /// No description provided for @companyTeamSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Invite members and manage roles'**
  String get companyTeamSubtitle;

  /// No description provided for @companyVerificationSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Business documents and verification'**
  String get companyVerificationSubtitle;

  /// No description provided for @companyJobsUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'Company jobs are coming'**
  String get companyJobsUnavailableTitle;

  /// No description provided for @companyJobsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Assigning requests to your team and tracking their progress isn\'t available yet. It\'s being added in the next update.'**
  String get companyJobsUnavailable;

  /// No description provided for @companyFinanceUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'Company finance is coming'**
  String get companyFinanceUnavailableTitle;

  /// No description provided for @companyFinanceUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Company revenue, payments and reports aren\'t available yet. They\'re being added in the next update.'**
  String get companyFinanceUnavailable;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// No description provided for @accountSection.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountSection;

  /// No description provided for @activitySection.
  ///
  /// In en, this message translates to:
  /// **'Activity'**
  String get activitySection;

  /// No description provided for @settingsSection.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsSection;

  /// No description provided for @appearance.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get appearance;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @languageArabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get languageArabic;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @logoutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Log out?'**
  String get logoutConfirmTitle;

  /// No description provided for @logoutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'You\'ll need to sign in again to use SAHL on this device.'**
  String get logoutConfirmMessage;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @homeActiveRequest.
  ///
  /// In en, this message translates to:
  /// **'Your active request'**
  String get homeActiveRequest;

  /// No description provided for @homeRecommended.
  ///
  /// In en, this message translates to:
  /// **'Top-rated providers'**
  String get homeRecommended;

  /// No description provided for @homePromotions.
  ///
  /// In en, this message translates to:
  /// **'Offers for you'**
  String get homePromotions;

  /// No description provided for @promoPercentOff.
  ///
  /// In en, this message translates to:
  /// **'{value}% off'**
  String promoPercentOff(int value);

  /// No description provided for @promoFlatOff.
  ///
  /// In en, this message translates to:
  /// **'Save {amount}'**
  String promoFlatOff(int amount);

  /// No description provided for @searchCategories.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get searchCategories;

  /// No description provided for @searchProviders.
  ///
  /// In en, this message translates to:
  /// **'Providers'**
  String get searchProviders;

  /// No description provided for @searchNoResults.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches “{query}”.'**
  String searchNoResults(String query);

  /// No description provided for @serviceProvidersTitle.
  ///
  /// In en, this message translates to:
  /// **'Providers'**
  String get serviceProvidersTitle;

  /// No description provided for @serviceProvidersCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 provider} other{{count} providers}}'**
  String serviceProvidersCount(int count);

  /// No description provided for @priceFrom.
  ///
  /// In en, this message translates to:
  /// **'From {amount}'**
  String priceFrom(String amount);

  /// No description provided for @priceRange.
  ///
  /// In en, this message translates to:
  /// **'{min} – {max}'**
  String priceRange(String min, String max);

  /// No description provided for @priceOnRequest.
  ///
  /// In en, this message translates to:
  /// **'Price on request'**
  String get priceOnRequest;

  /// No description provided for @sortRating.
  ///
  /// In en, this message translates to:
  /// **'Top rated'**
  String get sortRating;

  /// No description provided for @sortJobs.
  ///
  /// In en, this message translates to:
  /// **'Most jobs'**
  String get sortJobs;

  /// No description provided for @sortNewest.
  ///
  /// In en, this message translates to:
  /// **'Newest'**
  String get sortNewest;

  /// No description provided for @requestServiceAction.
  ///
  /// In en, this message translates to:
  /// **'Request this service'**
  String get requestServiceAction;

  /// No description provided for @postProjectAction.
  ///
  /// In en, this message translates to:
  /// **'Post a project'**
  String get postProjectAction;

  /// No description provided for @serviceNoProviders.
  ///
  /// In en, this message translates to:
  /// **'No providers offer this service yet.'**
  String get serviceNoProviders;

  /// No description provided for @onDemandMatchingNote.
  ///
  /// In en, this message translates to:
  /// **'We send your request to the best available provider near you — no need to pick one.'**
  String get onDemandMatchingNote;

  /// No description provided for @remotePickProviderNote.
  ///
  /// In en, this message translates to:
  /// **'Choose a provider below to book this service.'**
  String get remotePickProviderNote;

  /// No description provided for @verifiedProvider.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verifiedProvider;

  /// No description provided for @yearsExperience.
  ///
  /// In en, this message translates to:
  /// **'{years, plural, =1{1 yr experience} other{{years} yrs experience}}'**
  String yearsExperience(int years);

  /// No description provided for @jobsDone.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 job} other{{count} jobs}}'**
  String jobsDone(int count);

  /// No description provided for @reviewsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No reviews} =1{1 review} other{{count} reviews}}'**
  String reviewsCount(int count);

  /// No description provided for @aboutTitle.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get aboutTitle;

  /// No description provided for @skillsTitle.
  ///
  /// In en, this message translates to:
  /// **'Skills'**
  String get skillsTitle;

  /// No description provided for @servicesOffered.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get servicesOffered;

  /// No description provided for @reviewsTitle.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviewsTitle;

  /// No description provided for @noReviewsYet.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet.'**
  String get noReviewsYet;

  /// No description provided for @bookProviderAction.
  ///
  /// In en, this message translates to:
  /// **'Book this provider'**
  String get bookProviderAction;

  /// No description provided for @memberOfCompany.
  ///
  /// In en, this message translates to:
  /// **'Part of {company}'**
  String memberOfCompany(String company);

  /// No description provided for @bookingTitle.
  ///
  /// In en, this message translates to:
  /// **'Request a service'**
  String get bookingTitle;

  /// No description provided for @bookingStepOf.
  ///
  /// In en, this message translates to:
  /// **'Step {step} of {total}'**
  String bookingStepOf(int step, int total);

  /// No description provided for @bookingStepService.
  ///
  /// In en, this message translates to:
  /// **'Which service do you need?'**
  String get bookingStepService;

  /// No description provided for @bookingStepDetails.
  ///
  /// In en, this message translates to:
  /// **'Tell us about the job'**
  String get bookingStepDetails;

  /// No description provided for @bookingStepLocation.
  ///
  /// In en, this message translates to:
  /// **'Where should the provider come?'**
  String get bookingStepLocation;

  /// No description provided for @bookingStepTime.
  ///
  /// In en, this message translates to:
  /// **'When do you need it?'**
  String get bookingStepTime;

  /// No description provided for @bookingStepReview.
  ///
  /// In en, this message translates to:
  /// **'Check your request'**
  String get bookingStepReview;

  /// No description provided for @bookingDescribeHint.
  ///
  /// In en, this message translates to:
  /// **'Describe what you need, e.g. the kitchen tap is leaking…'**
  String get bookingDescribeHint;

  /// No description provided for @bookingEmergency.
  ///
  /// In en, this message translates to:
  /// **'This is an emergency'**
  String get bookingEmergency;

  /// No description provided for @bookingEmergencyHint.
  ///
  /// In en, this message translates to:
  /// **'Emergency requests are offered to providers first'**
  String get bookingEmergencyHint;

  /// No description provided for @bookingUseLocation.
  ///
  /// In en, this message translates to:
  /// **'Use my current location'**
  String get bookingUseLocation;

  /// No description provided for @bookingLocating.
  ///
  /// In en, this message translates to:
  /// **'Getting your location…'**
  String get bookingLocating;

  /// No description provided for @bookingLocationSet.
  ///
  /// In en, this message translates to:
  /// **'Location set'**
  String get bookingLocationSet;

  /// No description provided for @bookingLocationDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permission was denied. Allow it in your phone settings to continue.'**
  String get bookingLocationDenied;

  /// No description provided for @bookingLocationOff.
  ///
  /// In en, this message translates to:
  /// **'Turn on location services to continue.'**
  String get bookingLocationOff;

  /// No description provided for @bookingLocationFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t get your location. Please try again.'**
  String get bookingLocationFailed;

  /// No description provided for @bookingAddressHint.
  ///
  /// In en, this message translates to:
  /// **'Address or landmark (optional)'**
  String get bookingAddressHint;

  /// No description provided for @bookingNow.
  ///
  /// In en, this message translates to:
  /// **'As soon as possible'**
  String get bookingNow;

  /// No description provided for @bookingSchedule.
  ///
  /// In en, this message translates to:
  /// **'Schedule for later'**
  String get bookingSchedule;

  /// No description provided for @bookingPickTime.
  ///
  /// In en, this message translates to:
  /// **'Pick date & time'**
  String get bookingPickTime;

  /// No description provided for @bookingSubmit.
  ///
  /// In en, this message translates to:
  /// **'Send request'**
  String get bookingSubmit;

  /// No description provided for @bookingSuccessTitle.
  ///
  /// In en, this message translates to:
  /// **'Request sent!'**
  String get bookingSuccessTitle;

  /// No description provided for @bookingSuccessMessage.
  ///
  /// In en, this message translates to:
  /// **'We\'re finding the best available provider. Follow updates in My Requests.'**
  String get bookingSuccessMessage;

  /// No description provided for @bookingScheduledSuccessMessage.
  ///
  /// In en, this message translates to:
  /// **'Your request is scheduled. Follow updates in My Requests.'**
  String get bookingScheduledSuccessMessage;

  /// No description provided for @viewMyRequests.
  ///
  /// In en, this message translates to:
  /// **'View my requests'**
  String get viewMyRequests;

  /// No description provided for @addressPrefix.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get addressPrefix;

  /// No description provided for @requestsBucketAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get requestsBucketAll;

  /// No description provided for @requestsBucketPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get requestsBucketPending;

  /// No description provided for @requestsBucketAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get requestsBucketAccepted;

  /// No description provided for @requestsBucketInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get requestsBucketInProgress;

  /// No description provided for @requestsBucketCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get requestsBucketCompleted;

  /// No description provided for @requestsBucketCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get requestsBucketCancelled;

  /// No description provided for @requestsEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet.'**
  String get requestsEmpty;

  /// No description provided for @scheduledFor.
  ///
  /// In en, this message translates to:
  /// **'Scheduled for {date}'**
  String scheduledFor(String date);

  /// No description provided for @requestedOn.
  ///
  /// In en, this message translates to:
  /// **'Requested {date}'**
  String requestedOn(String date);

  /// No description provided for @assignedProvider.
  ///
  /// In en, this message translates to:
  /// **'Your provider'**
  String get assignedProvider;

  /// No description provided for @rateService.
  ///
  /// In en, this message translates to:
  /// **'Rate this service'**
  String get rateService;

  /// No description provided for @reviewTitle.
  ///
  /// In en, this message translates to:
  /// **'How was the service?'**
  String get reviewTitle;

  /// No description provided for @reviewCommentHint.
  ///
  /// In en, this message translates to:
  /// **'Tell others about your experience (optional)'**
  String get reviewCommentHint;

  /// No description provided for @reviewSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit review'**
  String get reviewSubmit;

  /// No description provided for @reviewThanks.
  ///
  /// In en, this message translates to:
  /// **'Thanks for your review!'**
  String get reviewThanks;

  /// No description provided for @yourRating.
  ///
  /// In en, this message translates to:
  /// **'Your rating'**
  String get yourRating;

  /// No description provided for @milestoneStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Not started'**
  String get milestoneStatusPending;

  /// No description provided for @milestoneStatusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get milestoneStatusInProgress;

  /// No description provided for @milestoneStatusSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Waiting for approval'**
  String get milestoneStatusSubmitted;

  /// No description provided for @milestoneStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get milestoneStatusApproved;

  /// No description provided for @milestoneStatusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get milestoneStatusPaid;

  /// No description provided for @milestoneStart.
  ///
  /// In en, this message translates to:
  /// **'Start work'**
  String get milestoneStart;

  /// No description provided for @milestoneSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit for approval'**
  String get milestoneSubmit;

  /// No description provided for @milestoneApprove.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get milestoneApprove;

  /// No description provided for @milestoneApproveConfirm.
  ///
  /// In en, this message translates to:
  /// **'Approve this milestone?'**
  String get milestoneApproveConfirm;

  /// No description provided for @milestoneApproveMessage.
  ///
  /// In en, this message translates to:
  /// **'Approving confirms the work for this milestone is done. SAHL then releases the payment.'**
  String get milestoneApproveMessage;

  /// No description provided for @cancelProject.
  ///
  /// In en, this message translates to:
  /// **'Cancel project'**
  String get cancelProject;

  /// No description provided for @cancelProjectConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel this project?'**
  String get cancelProjectConfirm;

  /// No description provided for @cancelProjectMessage.
  ///
  /// In en, this message translates to:
  /// **'Open bids will be rejected. This can\'t be undone.'**
  String get cancelProjectMessage;

  /// No description provided for @walletPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get walletPending;

  /// No description provided for @walletLocked.
  ///
  /// In en, this message translates to:
  /// **'On hold'**
  String get walletLocked;

  /// No description provided for @txStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get txStatusPending;

  /// No description provided for @txStatusHeld.
  ///
  /// In en, this message translates to:
  /// **'On hold'**
  String get txStatusHeld;

  /// No description provided for @txStatusSucceeded.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get txStatusSucceeded;

  /// No description provided for @txStatusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get txStatusFailed;

  /// No description provided for @txStatusReversed.
  ///
  /// In en, this message translates to:
  /// **'Reversed'**
  String get txStatusReversed;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit profile'**
  String get editProfile;

  /// No description provided for @editProfileSaved.
  ///
  /// In en, this message translates to:
  /// **'Profile updated'**
  String get editProfileSaved;

  /// No description provided for @cityLabel.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get cityLabel;

  /// No description provided for @addressLabel.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get addressLabel;

  /// No description provided for @bioLabel.
  ///
  /// In en, this message translates to:
  /// **'About me'**
  String get bioLabel;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get saveChanges;

  /// No description provided for @security.
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get security;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get currentPassword;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get newPassword;

  /// No description provided for @passwordChanged.
  ///
  /// In en, this message translates to:
  /// **'Password changed. You were signed out on other devices.'**
  String get passwordChanged;

  /// No description provided for @notificationPrefsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notification preferences'**
  String get notificationPrefsTitle;

  /// No description provided for @prefOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders & requests'**
  String get prefOrders;

  /// No description provided for @prefOrdersHint.
  ///
  /// In en, this message translates to:
  /// **'Status changes on your requests and jobs'**
  String get prefOrdersHint;

  /// No description provided for @prefMessages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get prefMessages;

  /// No description provided for @prefMessagesHint.
  ///
  /// In en, this message translates to:
  /// **'New messages from customers and providers'**
  String get prefMessagesHint;

  /// No description provided for @prefPromotions.
  ///
  /// In en, this message translates to:
  /// **'Offers & promotions'**
  String get prefPromotions;

  /// No description provided for @prefPromotionsHint.
  ///
  /// In en, this message translates to:
  /// **'Discounts and news from SAHL'**
  String get prefPromotionsHint;

  /// No description provided for @prefAccount.
  ///
  /// In en, this message translates to:
  /// **'Account & security'**
  String get prefAccount;

  /// No description provided for @prefAccountHint.
  ///
  /// In en, this message translates to:
  /// **'Sign-ins, verification and account changes'**
  String get prefAccountHint;

  /// No description provided for @helpSupport.
  ///
  /// In en, this message translates to:
  /// **'Help & support'**
  String get helpSupport;

  /// No description provided for @supportNewTicket.
  ///
  /// In en, this message translates to:
  /// **'New support request'**
  String get supportNewTicket;

  /// No description provided for @supportSubject.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get supportSubject;

  /// No description provided for @supportMessage.
  ///
  /// In en, this message translates to:
  /// **'How can we help?'**
  String get supportMessage;

  /// No description provided for @supportSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get supportSend;

  /// No description provided for @supportEmpty.
  ///
  /// In en, this message translates to:
  /// **'No support requests yet. We\'re here if you need us.'**
  String get supportEmpty;

  /// No description provided for @supportReplyHint.
  ///
  /// In en, this message translates to:
  /// **'Write a reply…'**
  String get supportReplyHint;

  /// No description provided for @supportClosedNote.
  ///
  /// In en, this message translates to:
  /// **'This request is closed.'**
  String get supportClosedNote;

  /// No description provided for @ticketStatusOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get ticketStatusOpen;

  /// No description provided for @ticketStatusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get ticketStatusInProgress;

  /// No description provided for @ticketStatusResolved.
  ///
  /// In en, this message translates to:
  /// **'Resolved'**
  String get ticketStatusResolved;

  /// No description provided for @ticketStatusClosed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get ticketStatusClosed;

  /// No description provided for @errorInvalidCurrentPassword.
  ///
  /// In en, this message translates to:
  /// **'Your current password is incorrect.'**
  String get errorInvalidCurrentPassword;

  /// No description provided for @errorPasswordUnchanged.
  ///
  /// In en, this message translates to:
  /// **'Choose a password different from your current one.'**
  String get errorPasswordUnchanged;

  /// No description provided for @errorAlreadyReviewed.
  ///
  /// In en, this message translates to:
  /// **'You already reviewed this job.'**
  String get errorAlreadyReviewed;

  /// No description provided for @errorJobNotCompleted.
  ///
  /// In en, this message translates to:
  /// **'You can review a job once it\'s completed.'**
  String get errorJobNotCompleted;

  /// No description provided for @errorTicketClosed.
  ///
  /// In en, this message translates to:
  /// **'This support request is closed.'**
  String get errorTicketClosed;

  /// No description provided for @errorProjectNotOpen.
  ///
  /// In en, this message translates to:
  /// **'This project is no longer open.'**
  String get errorProjectNotOpen;

  /// No description provided for @validationDescriptionTooShort.
  ///
  /// In en, this message translates to:
  /// **'Please add a few more details (at least 5 characters).'**
  String get validationDescriptionTooShort;

  /// No description provided for @bookingScheduleInPast.
  ///
  /// In en, this message translates to:
  /// **'Pick a time in the future.'**
  String get bookingScheduleInPast;

  /// No description provided for @openSettings.
  ///
  /// In en, this message translates to:
  /// **'Open settings'**
  String get openSettings;

  /// No description provided for @contractStatusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get contractStatusInProgress;

  /// No description provided for @contractStatusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get contractStatusCompleted;

  /// No description provided for @contractStatusDisputed.
  ///
  /// In en, this message translates to:
  /// **'In dispute'**
  String get contractStatusDisputed;

  /// No description provided for @contractTotal.
  ///
  /// In en, this message translates to:
  /// **'Contract total'**
  String get contractTotal;

  /// No description provided for @viewContract.
  ///
  /// In en, this message translates to:
  /// **'View contract'**
  String get viewContract;

  /// No description provided for @projectBudget.
  ///
  /// In en, this message translates to:
  /// **'Budget'**
  String get projectBudget;

  /// No description provided for @txTypeDeposit.
  ///
  /// In en, this message translates to:
  /// **'Deposit'**
  String get txTypeDeposit;

  /// No description provided for @txTypeWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal'**
  String get txTypeWithdrawal;

  /// No description provided for @txTypeTransfer.
  ///
  /// In en, this message translates to:
  /// **'Transfer'**
  String get txTypeTransfer;

  /// No description provided for @txTypeEscrowHold.
  ///
  /// In en, this message translates to:
  /// **'Payment held'**
  String get txTypeEscrowHold;

  /// No description provided for @txTypeEscrowRelease.
  ///
  /// In en, this message translates to:
  /// **'Payment released'**
  String get txTypeEscrowRelease;

  /// No description provided for @txTypeRefund.
  ///
  /// In en, this message translates to:
  /// **'Refund'**
  String get txTypeRefund;

  /// No description provided for @txTypeCommission.
  ///
  /// In en, this message translates to:
  /// **'Service fee'**
  String get txTypeCommission;

  /// No description provided for @txTypeBonus.
  ///
  /// In en, this message translates to:
  /// **'Bonus'**
  String get txTypeBonus;

  /// No description provided for @txTypeCashback.
  ///
  /// In en, this message translates to:
  /// **'Cashback'**
  String get txTypeCashback;

  /// No description provided for @txTypeReward.
  ///
  /// In en, this message translates to:
  /// **'Reward'**
  String get txTypeReward;

  /// No description provided for @txTypeAdjustment.
  ///
  /// In en, this message translates to:
  /// **'Adjustment'**
  String get txTypeAdjustment;

  /// No description provided for @txTypePenalty.
  ///
  /// In en, this message translates to:
  /// **'Penalty'**
  String get txTypePenalty;

  /// No description provided for @txTypePromotion.
  ///
  /// In en, this message translates to:
  /// **'Promotion'**
  String get txTypePromotion;

  /// No description provided for @txTypeTax.
  ///
  /// In en, this message translates to:
  /// **'Tax'**
  String get txTypeTax;

  /// No description provided for @txTypeProcessingFee.
  ///
  /// In en, this message translates to:
  /// **'Processing fee'**
  String get txTypeProcessingFee;

  /// No description provided for @walletFrozen.
  ///
  /// In en, this message translates to:
  /// **'Your wallet is frozen. Contact support for help.'**
  String get walletFrozen;

  /// No description provided for @myListingsTitle.
  ///
  /// In en, this message translates to:
  /// **'My posted services'**
  String get myListingsTitle;

  /// No description provided for @myListingsEmpty.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t posted a service yet. Post one so customers can order it directly.'**
  String get myListingsEmpty;

  /// No description provided for @postServiceAction.
  ///
  /// In en, this message translates to:
  /// **'Post a service'**
  String get postServiceAction;

  /// No description provided for @editServiceTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit service'**
  String get editServiceTitle;

  /// No description provided for @listingStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Waiting for review'**
  String get listingStatusPending;

  /// No description provided for @listingStatusPublished.
  ///
  /// In en, this message translates to:
  /// **'Published'**
  String get listingStatusPublished;

  /// No description provided for @listingStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Needs changes'**
  String get listingStatusRejected;

  /// No description provided for @listingStatusPaused.
  ///
  /// In en, this message translates to:
  /// **'Paused'**
  String get listingStatusPaused;

  /// No description provided for @listingRejectedReason.
  ///
  /// In en, this message translates to:
  /// **'Reviewer\'s note: {reason}'**
  String listingRejectedReason(String reason);

  /// No description provided for @listingCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get listingCategory;

  /// No description provided for @listingTitleLabel.
  ///
  /// In en, this message translates to:
  /// **'Service title'**
  String get listingTitleLabel;

  /// No description provided for @listingTitleHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. I will design your company logo'**
  String get listingTitleHint;

  /// No description provided for @listingDescriptionLabel.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get listingDescriptionLabel;

  /// No description provided for @listingDescriptionHint.
  ///
  /// In en, this message translates to:
  /// **'What\'s included, what you need from the customer, and how you work'**
  String get listingDescriptionHint;

  /// No description provided for @listingPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Starting price'**
  String get listingPriceLabel;

  /// No description provided for @listingDeliveryLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivery (days)'**
  String get listingDeliveryLabel;

  /// No description provided for @listingCoverTitle.
  ///
  /// In en, this message translates to:
  /// **'Cover image'**
  String get listingCoverTitle;

  /// No description provided for @listingCoverGuide.
  ///
  /// In en, this message translates to:
  /// **'Use a landscape 16:9 image, ideally 1280×720 px (at least 800×450). JPG, PNG or WebP, up to 5 MB. Keep text and faces near the middle — the edges may be cropped on small cards.'**
  String get listingCoverGuide;

  /// No description provided for @listingCoverPick.
  ///
  /// In en, this message translates to:
  /// **'Choose cover'**
  String get listingCoverPick;

  /// No description provided for @listingCoverChange.
  ///
  /// In en, this message translates to:
  /// **'Change cover'**
  String get listingCoverChange;

  /// No description provided for @listingGalleryTitle.
  ///
  /// In en, this message translates to:
  /// **'Gallery'**
  String get listingGalleryTitle;

  /// No description provided for @listingGalleryGuide.
  ///
  /// In en, this message translates to:
  /// **'Up to {max} images of your work (same size rules as the cover).'**
  String listingGalleryGuide(int max);

  /// No description provided for @listingGalleryAdd.
  ///
  /// In en, this message translates to:
  /// **'Add images'**
  String get listingGalleryAdd;

  /// No description provided for @listingRemoveImage.
  ///
  /// In en, this message translates to:
  /// **'Remove image'**
  String get listingRemoveImage;

  /// No description provided for @listingUploading.
  ///
  /// In en, this message translates to:
  /// **'Uploading…'**
  String get listingUploading;

  /// No description provided for @listingImageTooSmall.
  ///
  /// In en, this message translates to:
  /// **'This image is too small. Use at least 800×450 px.'**
  String get listingImageTooSmall;

  /// No description provided for @listingImageTooLarge.
  ///
  /// In en, this message translates to:
  /// **'This image is larger than 5 MB.'**
  String get listingImageTooLarge;

  /// No description provided for @listingImageNotLandscape.
  ///
  /// In en, this message translates to:
  /// **'This image isn\'t landscape — it will be cropped to 16:9.'**
  String get listingImageNotLandscape;

  /// No description provided for @listingImageUnreadable.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t read this image. Try another file.'**
  String get listingImageUnreadable;

  /// No description provided for @listingUploadFailed.
  ///
  /// In en, this message translates to:
  /// **'Upload failed. Check your connection and try again.'**
  String get listingUploadFailed;

  /// No description provided for @listingCoverRequired.
  ///
  /// In en, this message translates to:
  /// **'Add a cover image.'**
  String get listingCoverRequired;

  /// No description provided for @listingUploadsOff.
  ///
  /// In en, this message translates to:
  /// **'Image uploads aren\'t available yet, so services can\'t be posted right now.'**
  String get listingUploadsOff;

  /// No description provided for @listingSubmit.
  ///
  /// In en, this message translates to:
  /// **'Send for review'**
  String get listingSubmit;

  /// No description provided for @listingReviewNote.
  ///
  /// In en, this message translates to:
  /// **'SAHL reviews every new or edited service before customers can see it.'**
  String get listingReviewNote;

  /// No description provided for @listingSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Sent for review. We\'ll notify you when it\'s live.'**
  String get listingSubmitted;

  /// No description provided for @listingPause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get listingPause;

  /// No description provided for @listingResume.
  ///
  /// In en, this message translates to:
  /// **'Resume'**
  String get listingResume;

  /// No description provided for @listingDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get listingDelete;

  /// No description provided for @listingDeleteConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete this service?'**
  String get listingDeleteConfirm;

  /// No description provided for @listingDeleteMessage.
  ///
  /// In en, this message translates to:
  /// **'It will be removed for good, with its gallery.'**
  String get listingDeleteMessage;

  /// No description provided for @listingEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get listingEdit;

  /// No description provided for @listingsSectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Services you can order'**
  String get listingsSectionTitle;

  /// No description provided for @listingDeliveryDays.
  ///
  /// In en, this message translates to:
  /// **'{days, plural, =1{1-day delivery} other{{days}-day delivery}}'**
  String listingDeliveryDays(int days);

  /// No description provided for @listingOrderAction.
  ///
  /// In en, this message translates to:
  /// **'Order this service'**
  String get listingOrderAction;

  /// No description provided for @listingOrderConfirm.
  ///
  /// In en, this message translates to:
  /// **'Order this service?'**
  String get listingOrderConfirm;

  /// No description provided for @listingOrderMessage.
  ///
  /// In en, this message translates to:
  /// **'“{title}” from {provider}, starting at {price}. You can agree on milestones after ordering.'**
  String listingOrderMessage(String title, String provider, String price);

  /// No description provided for @listingQuoteAction.
  ///
  /// In en, this message translates to:
  /// **'Request a project quote'**
  String get listingQuoteAction;

  /// No description provided for @listingAboutService.
  ///
  /// In en, this message translates to:
  /// **'About this service'**
  String get listingAboutService;

  /// No description provided for @listingAboutProvider.
  ///
  /// In en, this message translates to:
  /// **'About the provider'**
  String get listingAboutProvider;

  /// No description provided for @providerServicesListings.
  ///
  /// In en, this message translates to:
  /// **'Posted services'**
  String get providerServicesListings;

  /// No description provided for @errorListingNotEligible.
  ///
  /// In en, this message translates to:
  /// **'Your provider profile must be verified before you can post services.'**
  String get errorListingNotEligible;

  /// No description provided for @errorInvalidImage.
  ///
  /// In en, this message translates to:
  /// **'One of the images wasn\'t uploaded through the app. Please add it again.'**
  String get errorInvalidImage;

  /// No description provided for @errorUploadsOff.
  ///
  /// In en, this message translates to:
  /// **'Image uploads aren\'t available right now.'**
  String get errorUploadsOff;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @resetTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset your password'**
  String get resetTitle;

  /// No description provided for @resetRequestSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your email or phone number. SAHL support will contact you with a 6-digit code.'**
  String get resetRequestSubtitle;

  /// No description provided for @resetRequestButton.
  ///
  /// In en, this message translates to:
  /// **'Send request'**
  String get resetRequestButton;

  /// No description provided for @resetHaveCode.
  ///
  /// In en, this message translates to:
  /// **'I already have a code'**
  String get resetHaveCode;

  /// No description provided for @resetCodeTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your code'**
  String get resetCodeTitle;

  /// No description provided for @resetRequestedMessage.
  ///
  /// In en, this message translates to:
  /// **'Your request was sent. When SAHL support gives you the 6-digit code, enter it below with a new password. Codes are valid for 30 minutes.'**
  String get resetRequestedMessage;

  /// No description provided for @resetCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get resetCodeLabel;

  /// No description provided for @resetConfirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm new password'**
  String get resetConfirmPassword;

  /// No description provided for @resetSubmit.
  ///
  /// In en, this message translates to:
  /// **'Set new password'**
  String get resetSubmit;

  /// No description provided for @resetDone.
  ///
  /// In en, this message translates to:
  /// **'Password changed. Sign in with your new password.'**
  String get resetDone;

  /// No description provided for @validationResetCode.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code'**
  String get validationResetCode;

  /// No description provided for @errorInvalidResetCode.
  ///
  /// In en, this message translates to:
  /// **'The code is wrong or has expired. Check it, or ask for a new one.'**
  String get errorInvalidResetCode;

  /// No description provided for @errorTooManyAttempts.
  ///
  /// In en, this message translates to:
  /// **'Too many wrong codes. Ask SAHL support for a new one.'**
  String get errorTooManyAttempts;

  /// No description provided for @emailOrPhone.
  ///
  /// In en, this message translates to:
  /// **'Email or phone number'**
  String get emailOrPhone;
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
