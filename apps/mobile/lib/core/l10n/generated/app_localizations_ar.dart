// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'سهل';

  @override
  String get getStarted => 'ابدأ الآن';

  @override
  String get login => 'تسجيل الدخول';

  @override
  String get register => 'إنشاء حساب';

  @override
  String get phoneNumber => 'رقم الهاتف';

  @override
  String get password => 'كلمة المرور';

  @override
  String get fullName => 'الاسم الكامل';

  @override
  String get serviceTypeOnDemand => 'فوري';

  @override
  String get serviceTypeContract => 'عقود';

  @override
  String get serviceTypeRemote => 'عن بُعد';

  @override
  String get roleCustomer => 'عميل';

  @override
  String get roleProvider => 'مزود خدمة';

  @override
  String get switchToProvider => 'التبديل إلى مزود خدمة';

  @override
  String get switchToCustomer => 'التبديل إلى عميل';

  @override
  String get requestStatusSearching => 'جاري البحث عن مزود خدمة…';

  @override
  String get requestStatusAssigned => 'تم تعيين مزود الخدمة';

  @override
  String get requestStatusEnRoute => 'مزود الخدمة في الطريق';

  @override
  String get requestStatusInProgress => 'قيد التنفيذ';

  @override
  String get requestStatusCompleted => 'مكتمل';

  @override
  String get requestStatusCancelled => 'ملغي';

  @override
  String get errorGeneric => 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.';

  @override
  String get errorNoConnection => 'لا يوجد اتصال بالإنترنت.';

  @override
  String get errorTimeout =>
      'استغرق الطلب وقتًا طويلاً. الرجاء المحاولة مرة أخرى.';

  @override
  String get errorServerUnavailable =>
      'الخادم غير متاح مؤقتًا. الرجاء المحاولة بعد قليل.';

  @override
  String get errorValidation => 'الرجاء التحقق من المعلومات التي أدخلتها.';

  @override
  String get errorSessionExpired =>
      'انتهت صلاحية جلستك. الرجاء تسجيل الدخول مرة أخرى.';

  @override
  String get errorForbidden => 'ليس لديك صلاحية للقيام بذلك.';

  @override
  String get errorNotFound => 'لم نتمكن من العثور على ما تبحث عنه.';

  @override
  String get errorConflict => 'لا يمكن إتمام هذا الإجراء الآن.';

  @override
  String get errorTooManyRequests =>
      'محاولات كثيرة جدًا. الرجاء الانتظار قليلاً ثم المحاولة مرة أخرى.';

  @override
  String get errorInvalidCredentials => 'رقم الهاتف أو كلمة المرور غير صحيحة.';

  @override
  String get errorAccountNotActive =>
      'هذا الحساب غير مفعّل. يرجى التواصل مع الدعم.';

  @override
  String get errorUserNotFound => 'لم يتم العثور على حساب بهذا الرقم.';

  @override
  String get errorPhoneAlreadyRegistered => 'يوجد حساب مسجل بهذا الرقم بالفعل.';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get cancel => 'إلغاء';

  @override
  String get confirm => 'تأكيد';

  @override
  String get save => 'حفظ';

  @override
  String get next => 'التالي';

  @override
  String get back => 'رجوع';

  @override
  String get done => 'تم';

  @override
  String get loading => 'جارٍ التحميل…';

  @override
  String get validationRequired => 'هذا الحقل مطلوب';

  @override
  String get validationPhoneInvalid => 'أدخل رقم هاتف صحيح';

  @override
  String get validationPasswordTooShort =>
      'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل';

  @override
  String get validationFullNameTooShort => 'أدخل اسمك الكامل';

  @override
  String get loginTitle => 'مرحباً بعودتك';

  @override
  String get loginSubtitle => 'سهل يربطك بالخدمات التي تحتاجها';

  @override
  String get registerTitle => 'أنشئ حسابك';

  @override
  String get registerSubtitle => 'الأمر لا يستغرق سوى دقيقة';

  @override
  String get dontHaveAccount => 'ليس لديك حساب؟';

  @override
  String get alreadyHaveAccount => 'لديك حساب بالفعل؟';

  @override
  String get homePlaceholderTitle => 'الرئيسية';

  @override
  String loggedInAs(String name) {
    return 'تم تسجيل الدخول باسم $name';
  }

  @override
  String get logout => 'تسجيل الخروج';

  @override
  String get sessionRestoring => 'جارٍ استعادة جلستك…';

  @override
  String homeGreeting(String name) {
    return 'مرحبًا، $name';
  }

  @override
  String get homeNoContent =>
      'لا يوجد شيء لعرضه هنا حاليًا — تحقق مرة أخرى قريبًا.';

  @override
  String get availabilityLabel => 'التوفر';

  @override
  String get availabilityOnline => 'متاح لاستقبال الطلبات';

  @override
  String get availabilityOffline => 'غير متاح';

  @override
  String get availabilityVacation => 'في إجازة';

  @override
  String get availabilityTemporarilyUnavailable => 'غير متاح مؤقتًا';

  @override
  String get availabilityEmergencyOffline => 'غير متصل (حالة طارئة)';

  @override
  String providerJobsCompleted(int count) {
    return '$count مهمة مكتملة';
  }

  @override
  String get companyDashboardTitle => 'الشركة';

  @override
  String companyVerificationStatus(String status) {
    return 'حالة التحقق: $status';
  }

  @override
  String get onDemandRequestDetailsTitle => 'تفاصيل الطلب';

  @override
  String get onDemandMyRequests => 'طلباتي';

  @override
  String get onDemandNewRequest => 'طلب جديد';

  @override
  String get onDemandCategory => 'الفئة';

  @override
  String get onDemandDescription => 'ما الذي تحتاجه؟';

  @override
  String get onDemandLatitude => 'خط العرض';

  @override
  String get onDemandLongitude => 'خط الطول';

  @override
  String get onDemandLocationHint => 'أدخل إحداثيات موقعك';

  @override
  String get onDemandEmergency => 'هذه حالة طارئة';

  @override
  String get onDemandSubmit => 'طلب الخدمة';

  @override
  String get onDemandCancelRequest => 'إلغاء الطلب';

  @override
  String get onDemandCancelConfirmTitle => 'إلغاء هذا الطلب؟';

  @override
  String get onDemandCancelConfirmBody => 'لا يمكن التراجع عن هذا الإجراء.';

  @override
  String get onDemandNoRequests => 'لم تطلب أي خدمات بعد.';

  @override
  String get onDemandJobOffers => 'عروض العمل';

  @override
  String get onDemandAccept => 'قبول';

  @override
  String get onDemandDecline => 'رفض';

  @override
  String get onDemandNoOffers => 'لا توجد عروض عمل حاليًا.';

  @override
  String onDemandQuotedPrice(String amount) {
    return 'السعر المقترح: $amount';
  }

  @override
  String get onDemandEmergencyBadge => 'طارئ';

  @override
  String get contractMyProjects => 'مشاريعي';

  @override
  String get contractBrowseProjects => 'تصفح المشاريع';

  @override
  String get contractMyBids => 'عروضي';

  @override
  String get contractNewProject => 'مشروع جديد';

  @override
  String get contractTitle => 'العنوان';

  @override
  String get contractDescription => 'الوصف';

  @override
  String get contractCategory => 'الفئة';

  @override
  String get contractBudgetMin => 'الحد الأدنى للميزانية (اختياري)';

  @override
  String get contractBudgetMax => 'الحد الأقصى للميزانية (اختياري)';

  @override
  String get contractSubmit => 'نشر المشروع';

  @override
  String get contractNoProjects => 'لم تنشر أي مشاريع بعد.';

  @override
  String get contractNoOpenProjects => 'لا توجد مشاريع مفتوحة حاليًا.';

  @override
  String get contractNoBids => 'لا توجد عروض بعد.';

  @override
  String get contractSubmitBid => 'تقديم عرض';

  @override
  String get contractBidAmount => 'قيمة عرضك';

  @override
  String get contractBidMessage => 'رسالة (اختياري)';

  @override
  String get contractWithdrawBid => 'سحب العرض';

  @override
  String get contractAwardBid => 'ترسية هذا العرض';

  @override
  String get contractStatusOpenForBids => 'مفتوح للعروض';

  @override
  String get contractStatusAwarded => 'تمت الترسية';

  @override
  String get contractStatusCancelled => 'ملغى';

  @override
  String get contractBidStatusSubmitted => 'مُقدَّم';

  @override
  String get contractBidStatusAccepted => 'مقبول';

  @override
  String get contractBidStatusRejected => 'مرفوض';

  @override
  String get contractBidStatusWithdrawn => 'مسحوب';

  @override
  String get contractMilestones => 'مراحل الإنجاز';

  @override
  String get contractNewMilestone => 'مرحلة جديدة';

  @override
  String get contractMilestoneTitle => 'عنوان المرحلة';

  @override
  String get contractMilestoneAmount => 'المبلغ';

  @override
  String get contractNoMilestones => 'لا توجد مراحل بعد.';

  @override
  String get contractDetailsTitle => 'تفاصيل المشروع';

  @override
  String get remoteMyEngagements => 'مشاريعي عن بُعد';

  @override
  String get remoteMyBookings => 'حجوزاتي';

  @override
  String get remoteNewEngagement => 'تعاقد جديد';

  @override
  String get remoteTitle => 'العنوان';

  @override
  String get remoteCategory => 'الفئة';

  @override
  String get remoteSelectCategoryFirst => 'اختر فئة لعرض مزودي الخدمة المتاحين';

  @override
  String get remoteProvider => 'مزود الخدمة';

  @override
  String get remoteNoProvidersForCategory =>
      'لا يوجد مزودو خدمة متاحون لهذه الفئة بعد.';

  @override
  String get remotePriceType => 'نوع السعر';

  @override
  String get remotePriceFixed => 'سعر ثابت';

  @override
  String get remotePriceHourly => 'سعر بالساعة';

  @override
  String get remoteAmount => 'المبلغ';

  @override
  String get remoteSubmit => 'التعاقد مع المزود';

  @override
  String get remoteNoEngagements => 'لا توجد تعاقدات بعد.';

  @override
  String get remoteStatusActive => 'نشط';

  @override
  String get remoteStatusDelivered => 'تم التسليم';

  @override
  String get remoteStatusCompleted => 'مكتمل';

  @override
  String get remoteStatusCancelled => 'ملغى';

  @override
  String get remoteDetailsTitle => 'تفاصيل التعاقد';

  @override
  String get remoteMilestones => 'مراحل الإنجاز';

  @override
  String get remoteNewMilestone => 'مرحلة جديدة';

  @override
  String get remoteNoMilestones => 'لا توجد مراحل بعد.';

  @override
  String get walletTitle => 'المحفظة';

  @override
  String get walletAvailableBalance => 'الرصيد المتاح';

  @override
  String get walletTransactions => 'المعاملات';

  @override
  String get walletNoTransactions => 'لا توجد معاملات بعد.';

  @override
  String get walletWithdrawals => 'طلبات السحب';

  @override
  String get walletRequestWithdrawal => 'طلب سحب';

  @override
  String get walletWithdrawalAmount => 'المبلغ';

  @override
  String get walletWithdrawalMethod => 'طريقة الدفع';

  @override
  String get walletMethodBankTransfer => 'تحويل بنكي';

  @override
  String get walletMethodWalletTransfer => 'تحويل بين المحافظ';

  @override
  String get walletMethodMobileMoney => 'محفظة الهاتف المحمول';

  @override
  String get walletNoWithdrawals => 'لا توجد طلبات سحب بعد.';

  @override
  String get walletSubmitWithdrawal => 'إرسال الطلب';

  @override
  String get withdrawalStatusRequested => 'تم الطلب';

  @override
  String get withdrawalStatusPendingApproval => 'بانتظار الموافقة';

  @override
  String get withdrawalStatusApproved => 'تمت الموافقة';

  @override
  String get withdrawalStatusRejected => 'مرفوض';

  @override
  String get withdrawalStatusProcessing => 'قيد المعالجة';

  @override
  String get withdrawalStatusPaid => 'تم الدفع';

  @override
  String get withdrawalStatusFailed => 'فشل';

  @override
  String get disputeMyDisputes => 'نزاعاتي';

  @override
  String get disputeNoDisputes => 'لم تفتح أي نزاعات.';

  @override
  String get disputeOpenAction => 'فتح نزاع';

  @override
  String get disputeReason => 'ما الذي حدث؟';

  @override
  String get disputeSubmit => 'إرسال النزاع';

  @override
  String get disputeStatusOpen => 'مفتوح';

  @override
  String get disputeStatusUnderReview => 'قيد المراجعة';

  @override
  String get disputeStatusResolved => 'تم الحل';

  @override
  String get disputeStatusRejected => 'مرفوض';

  @override
  String disputeResolutionNotes(String notes) {
    return 'الحل: $notes';
  }

  @override
  String get notificationsTitle => 'الإشعارات';

  @override
  String get notificationsMarkAllRead => 'تحديد الكل كمقروء';

  @override
  String get notificationsNoNotifications => 'لا توجد إشعارات بعد.';

  @override
  String get companyMembersTitle => 'الأعضاء';

  @override
  String get companyPendingInvitations => 'الدعوات المعلقة';

  @override
  String get companyNoMembers => 'لا يوجد أعضاء بعد.';

  @override
  String get companyNoPendingInvitations => 'لا توجد دعوات معلقة.';

  @override
  String get companyInviteMember => 'دعوة عضو';

  @override
  String get companyInvitedPhone => 'رقم الهاتف';

  @override
  String get companyRole => 'الدور';

  @override
  String get companyRoleOwner => 'المالك';

  @override
  String get companyRoleManager => 'مدير';

  @override
  String get companyRoleStaff => 'موظف';

  @override
  String get companySendInvite => 'إرسال الدعوة';

  @override
  String get companyRemoveMember => 'إزالة';

  @override
  String get companyRemoveMemberConfirmTitle => 'إزالة هذا العضو؟';

  @override
  String get companyRemoveMemberConfirmBody => 'سيفقد الوصول إلى هذه الشركة.';

  @override
  String get companyCancelInvitation => 'إلغاء';

  @override
  String get companyInvitationStatusPending => 'معلقة';

  @override
  String get companyInvitationStatusAccepted => 'مقبولة';

  @override
  String get companyInvitationStatusRejected => 'مرفوضة';

  @override
  String get companyInvitationStatusExpired => 'منتهية';

  @override
  String get companyInvitationStatusCancelled => 'ملغاة';

  @override
  String get companyDocumentsTitle => 'مستندات التحقق';

  @override
  String get companyNoDocuments => 'لم يتم رفع أي مستندات بعد.';

  @override
  String get companyAddDocument => 'إضافة مستند';

  @override
  String get companyDocumentType => 'نوع المستند';

  @override
  String get companyDocumentFileUrl => 'رابط الملف';

  @override
  String get companyDocumentStatusPending => 'قيد المراجعة';

  @override
  String get companyDocumentStatusApproved => 'مقبول';

  @override
  String get companyDocumentStatusRejected => 'مرفوض';

  @override
  String get companySubmitVerification => 'إرسال للتحقق';

  @override
  String get companyVerificationSubmitted => 'تم الإرسال للمراجعة.';

  @override
  String get companyMyInvitationsTitle => 'دعواتي';

  @override
  String get companyNoInvitations => 'ليس لديك دعوات معلقة.';

  @override
  String companyInvitedToJoin(String companyName, String role) {
    return 'تمت دعوتك للانضمام إلى $companyName كـ $role';
  }

  @override
  String get companyAccept => 'قبول';

  @override
  String get providerProfileTitle => 'الملف الشخصي لمزود الخدمة';

  @override
  String get providerEditProfile => 'تعديل الملف الشخصي';

  @override
  String get providerBusinessName => 'اسم النشاط التجاري';

  @override
  String get providerBio => 'نبذة';

  @override
  String get providerYearsOfExperience => 'سنوات الخبرة';

  @override
  String get providerSkills => 'المهارات (مفصولة بفواصل)';

  @override
  String get providerTravelDistanceKm => 'مسافة التنقل (كم)';

  @override
  String get providerRemoteAvailable => 'متاح للعمل عن بُعد';

  @override
  String get providerEmergencyAvailable => 'متاح للمهام الطارئة';

  @override
  String get providerEmergencyContactName => 'اسم جهة الاتصال في الطوارئ';

  @override
  String get providerEmergencyContactPhone => 'هاتف جهة الاتصال في الطوارئ';

  @override
  String get providerSaveProfile => 'حفظ';

  @override
  String get providerDocumentsTitle => 'مستندات التحقق';

  @override
  String get providerNoDocuments => 'لم يتم رفع أي مستندات بعد.';

  @override
  String get providerAddDocument => 'إضافة مستند';

  @override
  String get providerDocumentType => 'نوع المستند';

  @override
  String get providerDocumentFileUrl => 'رابط الملف';

  @override
  String get providerDocumentStatusPending => 'قيد المراجعة';

  @override
  String get providerDocumentStatusApproved => 'مقبول';

  @override
  String get providerDocumentStatusRejected => 'مرفوض';

  @override
  String get providerSubmitVerification => 'إرسال للتحقق';

  @override
  String get providerVerificationSubmitted => 'تم الإرسال للمراجعة.';

  @override
  String get providerPortfolioTitle => 'معرض الأعمال';

  @override
  String get providerNoPortfolioItems => 'لا توجد عناصر في معرض الأعمال بعد.';

  @override
  String get providerAddPortfolioItem => 'إضافة عنصر';

  @override
  String get providerPortfolioMediaUrl => 'رابط الوسائط';

  @override
  String get providerPortfolioItemTitle => 'العنوان (اختياري)';

  @override
  String get providerPortfolioItemDescription => 'الوصف (اختياري)';

  @override
  String get providerDeleteItem => 'حذف';

  @override
  String get providerPayoutAccountsTitle => 'حسابات الدفع';

  @override
  String get providerNoPayoutAccounts => 'لا توجد حسابات دفع بعد.';

  @override
  String get providerAddPayoutAccount => 'إضافة حساب دفع';

  @override
  String get providerSetDefault => 'تعيين كافتراضي';

  @override
  String get providerDefaultBadge => 'افتراضي';

  @override
  String get providerBankName => 'اسم البنك';

  @override
  String get providerAccountNumber => 'رقم الحساب';

  @override
  String get providerAccountHolderName => 'اسم صاحب الحساب';

  @override
  String get providerWalletPhone => 'رقم هاتف المحفظة';

  @override
  String get providerMobileMoneyProvider => 'مزود المحفظة النقدية';

  @override
  String get providerPhoneNumber => 'رقم الهاتف';

  @override
  String get onboardingTitle1 => 'كل خدماتك';

  @override
  String get onboardingHighlight1 => 'في مكان واحد';

  @override
  String get onboardingBody1 =>
      'من الخدمات الفورية إلى المشاريع طويلة الأمد بكل سهولة وأمان';

  @override
  String get onboardingTitle2 => 'مزودون موثوقون';

  @override
  String get onboardingHighlight2 => 'بالقرب منك';

  @override
  String get onboardingBody2 => 'نراجع كل مقدم خدمة قبل انضمامه إلى سهل';

  @override
  String get onboardingTitle3 => 'ادفع بأمان';

  @override
  String get onboardingHighlight3 => 'وتابع كل مرحلة';

  @override
  String get onboardingBody3 =>
      'تبقى دفعتك محفوظة حتى تكتمل المهمة وتوافق عليها';

  @override
  String get alreadyHaveAccountLogin => 'لدي حساب بالفعل';

  @override
  String get switchLanguage => 'English';

  @override
  String get showPassword => 'إظهار كلمة المرور';

  @override
  String get hidePassword => 'إخفاء كلمة المرور';

  @override
  String get createAccountLink => 'إنشاء حساب';

  @override
  String get registerChooseTitle => 'إنشاء حساب جديد';

  @override
  String get registerChooseSubtitle => 'اختر نوع الحساب للمتابعة';

  @override
  String get accountTypeCustomer => 'عميل';

  @override
  String get accountTypeCustomerHint => 'اطلب الخدمات بسهولة';

  @override
  String get accountTypeProvider => 'مقدم خدمة';

  @override
  String get accountTypeProviderHint => 'قدّم خدماتك وحقق دخلك';

  @override
  String get accountTypeCompany => 'شركة';

  @override
  String get accountTypeCompanyHint => 'إدارة خدمات شركتك';

  @override
  String get continueAction => 'متابعة';

  @override
  String get registerDetailsTitleCustomer => 'إنشاء حساب عميل';

  @override
  String get registerDetailsTitleProvider => 'إنشاء حساب مقدم خدمة';

  @override
  String get registerDetailsTitleCompany => 'إنشاء حساب شركة';

  @override
  String get registerDetailsSubtitle => 'أدخل بياناتك للمتابعة';

  @override
  String get emailOptional => 'البريد الإلكتروني (اختياري)';

  @override
  String get confirmPassword => 'تأكيد كلمة المرور';

  @override
  String get businessName => 'اسم النشاط التجاري';

  @override
  String get companyName => 'اسم الشركة';

  @override
  String get validationPasswordsDontMatch => 'كلمتا المرور غير متطابقتين';

  @override
  String get validationEmailInvalid => 'أدخل بريداً إلكترونياً صحيحاً';

  @override
  String get termsNotice => 'بمتابعتك، أنت توافق على الشروط والأحكام';

  @override
  String get registerSuccessTitle => 'تم إنشاء حسابك بنجاح!';

  @override
  String get registerPendingBody =>
      'حسابك قيد المراجعة. يمكنك تسجيل الدخول بمجرد موافقة الإدارة عليه.';

  @override
  String get backToLogin => 'العودة لتسجيل الدخول';

  @override
  String get errorAccountPendingApproval =>
      'حسابك بانتظار موافقة الإدارة. يمكنك تسجيل الدخول بعد الموافقة.';

  @override
  String get errorEmailAlreadyRegistered =>
      'يوجد حساب مسجّل بهذا البريد الإلكتروني.';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navExplore => 'استكشف';

  @override
  String get navRequests => 'طلباتي';

  @override
  String get navWallet => 'المحفظة';

  @override
  String get navProfile => 'حسابي';

  @override
  String get navDashboard => 'لوحة التحكم';

  @override
  String get navJobs => 'المهام';

  @override
  String get navServices => 'خدماتي';

  @override
  String get navEarnings => 'الأرباح';

  @override
  String get navTeam => 'الفريق';

  @override
  String get navFinance => 'المالية';

  @override
  String get roleCompany => 'شركة';

  @override
  String get homeSearchHint => 'ابحث عن خدمة…';

  @override
  String get homeServiceTypesTitle => 'ماذا تحتاج اليوم؟';

  @override
  String get homeForYou => 'مختارات لك';

  @override
  String get serviceTypeShortTerm => 'قصيرة المدى';

  @override
  String get serviceTypeLongTerm => 'طويلة المدى';

  @override
  String get serviceTypeOnDemandHint => 'مساعدة سريعة الآن';

  @override
  String get serviceTypeShortTermHint => 'مهام عن بُعد ومشاريع قصيرة';

  @override
  String get serviceTypeLongTermHint => 'عقود ومشاريع كبيرة';

  @override
  String get exploreTitle => 'استكشف الخدمات';

  @override
  String get exploreEmpty => 'لا توجد خدمات في هذا القسم بعد.';

  @override
  String get exploreRequestAction => 'عرض التفاصيل';

  @override
  String get requestsTitle => 'طلباتي';

  @override
  String get requestsOnDemandSubtitle => 'الخدمات الفورية التي طلبتها';

  @override
  String get requestsShortTermSubtitle => 'الأعمال عن بُعد التي حجزتها';

  @override
  String get requestsLongTermSubtitle => 'المشاريع والعروض والعقود';

  @override
  String get requestsDisputesSubtitle => 'المشكلات التي أبلغت عنها';

  @override
  String get providerStatRating => 'التقييم';

  @override
  String get providerStatCompleted => 'مهام مكتملة';

  @override
  String get providerStatBalance => 'الرصيد المتاح';

  @override
  String get jobsTitle => 'المهام';

  @override
  String get jobsOffersSubtitle => 'طلبات فورية جديدة مرسلة إليك';

  @override
  String get jobsBookingsSubtitle => 'أعمال قصيرة المدى حجزها العملاء';

  @override
  String get jobsBidsSubtitle => 'عروضك على المشاريع طويلة المدى';

  @override
  String get jobsBrowseSubtitle => 'ابحث عن مشاريع طويلة المدى لتقديم عرض';

  @override
  String get servicesTitle => 'خدماتي';

  @override
  String get servicesPortfolioSubtitle => 'اعرض أفضل أعمالك للعملاء';

  @override
  String get servicesVerificationSubtitle => 'المستندات التي توثّق حسابك';

  @override
  String get servicesProfileSubtitle => 'اسم النشاط والنبذة والمهارات';

  @override
  String get companyStatMembers => 'أعضاء الفريق';

  @override
  String get companyStatPendingInvites => 'دعوات معلّقة';

  @override
  String get companyTeamSubtitle => 'ادعُ الأعضاء وأدر الصلاحيات';

  @override
  String get companyVerificationSubtitle => 'مستندات الشركة والتوثيق';

  @override
  String get companyJobsUnavailableTitle => 'مهام الشركة قادمة قريباً';

  @override
  String get companyJobsUnavailable =>
      'إسناد الطلبات لفريقك ومتابعة تقدّمها غير متاح بعد، وسيُضاف في التحديث القادم.';

  @override
  String get companyFinanceUnavailableTitle => 'مالية الشركة قادمة قريباً';

  @override
  String get companyFinanceUnavailable =>
      'إيرادات الشركة والمدفوعات والتقارير غير متاحة بعد، وستُضاف في التحديث القادم.';

  @override
  String get profileTitle => 'حسابي';

  @override
  String get accountSection => 'الحساب';

  @override
  String get activitySection => 'النشاط';

  @override
  String get settingsSection => 'الإعدادات';

  @override
  String get appearance => 'المظهر';

  @override
  String get themeSystem => 'النظام';

  @override
  String get themeLight => 'فاتح';

  @override
  String get themeDark => 'داكن';

  @override
  String get language => 'اللغة';

  @override
  String get languageArabic => 'العربية';

  @override
  String get languageEnglish => 'English';

  @override
  String get logoutConfirmTitle => 'تسجيل الخروج؟';

  @override
  String get logoutConfirmMessage =>
      'ستحتاج إلى تسجيل الدخول مرة أخرى لاستخدام سهل على هذا الجهاز.';

  @override
  String get seeAll => 'عرض الكل';

  @override
  String get homeActiveRequest => 'طلبك الحالي';

  @override
  String get homeRecommended => 'الأعلى تقييماً';

  @override
  String get homePromotions => 'عروض لك';

  @override
  String promoPercentOff(int value) {
    return 'خصم $value٪';
  }

  @override
  String promoFlatOff(int amount) {
    return 'وفّر $amount';
  }

  @override
  String get searchCategories => 'الخدمات';

  @override
  String get searchProviders => 'مقدمو الخدمة';

  @override
  String searchNoResults(String query) {
    return 'لا توجد نتائج لـ «$query».';
  }

  @override
  String get serviceProvidersTitle => 'مقدمو الخدمة';

  @override
  String serviceProvidersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مقدم خدمة',
      many: '$count مقدم خدمة',
      few: '$count مقدمي خدمة',
      two: 'مقدما خدمة',
      one: 'مقدم خدمة واحد',
      zero: 'لا يوجد مقدمو خدمة',
    );
    return '$_temp0';
  }

  @override
  String priceFrom(String amount) {
    return 'يبدأ من $amount';
  }

  @override
  String priceRange(String min, String max) {
    return '$min – $max';
  }

  @override
  String get priceOnRequest => 'السعر حسب الطلب';

  @override
  String get sortRating => 'الأعلى تقييماً';

  @override
  String get sortJobs => 'الأكثر إنجازاً';

  @override
  String get sortNewest => 'الأحدث';

  @override
  String get requestServiceAction => 'اطلب هذه الخدمة';

  @override
  String get postProjectAction => 'انشر مشروعاً';

  @override
  String get serviceNoProviders => 'لا يوجد مقدمو خدمة لهذه الخدمة بعد.';

  @override
  String get onDemandMatchingNote =>
      'نرسل طلبك إلى أفضل مقدم خدمة متاح بالقرب منك، دون الحاجة لاختياره.';

  @override
  String get remotePickProviderNote =>
      'اختر مقدم خدمة من القائمة لحجز هذه الخدمة.';

  @override
  String get verifiedProvider => 'موثّق';

  @override
  String yearsExperience(int years) {
    String _temp0 = intl.Intl.pluralLogic(
      years,
      locale: localeName,
      other: 'خبرة $years سنة',
      many: 'خبرة $years سنة',
      few: 'خبرة $years سنوات',
      two: 'خبرة سنتين',
      one: 'خبرة سنة واحدة',
    );
    return '$_temp0';
  }

  @override
  String jobsDone(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مهمة',
      many: '$count مهمة',
      few: '$count مهام',
      two: 'مهمتان',
      one: 'مهمة واحدة',
      zero: 'لا مهام',
    );
    return '$_temp0';
  }

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تقييم',
      many: '$count تقييمًا',
      few: '$count تقييمات',
      two: 'تقييمان',
      one: 'تقييم واحد',
      zero: 'لا تقييمات',
    );
    return '$_temp0';
  }

  @override
  String get aboutTitle => 'نبذة';

  @override
  String get skillsTitle => 'المهارات';

  @override
  String get servicesOffered => 'الخدمات';

  @override
  String get reviewsTitle => 'التقييمات';

  @override
  String get noReviewsYet => 'لا توجد تقييمات بعد.';

  @override
  String get bookProviderAction => 'احجز مقدم الخدمة';

  @override
  String memberOfCompany(String company) {
    return 'تابع لـ $company';
  }

  @override
  String get bookingTitle => 'طلب خدمة';

  @override
  String bookingStepOf(int step, int total) {
    return 'الخطوة $step من $total';
  }

  @override
  String get bookingStepService => 'ما الخدمة التي تحتاجها؟';

  @override
  String get bookingStepDetails => 'أخبرنا عن المهمة';

  @override
  String get bookingStepLocation => 'أين يأتي مقدم الخدمة؟';

  @override
  String get bookingStepTime => 'متى تحتاجها؟';

  @override
  String get bookingStepReview => 'راجع طلبك';

  @override
  String get bookingDescribeHint =>
      'صف ما تحتاجه، مثلاً: صنبور المطبخ يسرّب الماء…';

  @override
  String get bookingEmergency => 'هذه حالة طارئة';

  @override
  String get bookingEmergencyHint =>
      'تُعرض الطلبات الطارئة على مقدمي الخدمة أولاً';

  @override
  String get bookingUseLocation => 'استخدم موقعي الحالي';

  @override
  String get bookingLocating => 'جارٍ تحديد موقعك…';

  @override
  String get bookingLocationSet => 'تم تحديد الموقع';

  @override
  String get bookingLocationDenied =>
      'تم رفض إذن الموقع. اسمح به من إعدادات الهاتف للمتابعة.';

  @override
  String get bookingLocationOff => 'شغّل خدمات الموقع للمتابعة.';

  @override
  String get bookingLocationFailed => 'تعذّر تحديد موقعك. حاول مرة أخرى.';

  @override
  String get bookingAddressHint => 'العنوان أو أقرب معلم (اختياري)';

  @override
  String get bookingNow => 'في أقرب وقت';

  @override
  String get bookingSchedule => 'جدولة لوقت لاحق';

  @override
  String get bookingPickTime => 'اختر التاريخ والوقت';

  @override
  String get bookingSubmit => 'إرسال الطلب';

  @override
  String get bookingSuccessTitle => 'تم إرسال طلبك!';

  @override
  String get bookingSuccessMessage =>
      'نبحث الآن عن أفضل مقدم خدمة متاح. تابع التحديثات من «طلباتي».';

  @override
  String get bookingScheduledSuccessMessage =>
      'تمت جدولة طلبك. تابع التحديثات من «طلباتي».';

  @override
  String get viewMyRequests => 'عرض طلباتي';

  @override
  String get addressPrefix => 'العنوان';

  @override
  String get requestsBucketAll => 'الكل';

  @override
  String get requestsBucketPending => 'قيد الانتظار';

  @override
  String get requestsBucketAccepted => 'مقبولة';

  @override
  String get requestsBucketInProgress => 'قيد التنفيذ';

  @override
  String get requestsBucketCompleted => 'مكتملة';

  @override
  String get requestsBucketCancelled => 'ملغاة';

  @override
  String get requestsEmpty => 'لا يوجد شيء هنا بعد.';

  @override
  String scheduledFor(String date) {
    return 'مجدولة في $date';
  }

  @override
  String requestedOn(String date) {
    return 'طُلبت في $date';
  }

  @override
  String get assignedProvider => 'مقدم الخدمة';

  @override
  String get rateService => 'قيّم الخدمة';

  @override
  String get reviewTitle => 'كيف كانت الخدمة؟';

  @override
  String get reviewCommentHint => 'شارك تجربتك مع الآخرين (اختياري)';

  @override
  String get reviewSubmit => 'إرسال التقييم';

  @override
  String get reviewThanks => 'شكراً على تقييمك!';

  @override
  String get yourRating => 'تقييمك';

  @override
  String get milestoneStatusPending => 'لم تبدأ';

  @override
  String get milestoneStatusInProgress => 'قيد التنفيذ';

  @override
  String get milestoneStatusSubmitted => 'بانتظار الموافقة';

  @override
  String get milestoneStatusApproved => 'تمت الموافقة';

  @override
  String get milestoneStatusPaid => 'مدفوعة';

  @override
  String get milestoneStart => 'بدء العمل';

  @override
  String get milestoneSubmit => 'إرسال للموافقة';

  @override
  String get milestoneApprove => 'موافقة';

  @override
  String get milestoneApproveConfirm => 'الموافقة على هذه المرحلة؟';

  @override
  String get milestoneApproveMessage =>
      'الموافقة تؤكد اكتمال العمل في هذه المرحلة، ثم يقوم سهل بتحرير الدفعة.';

  @override
  String get cancelProject => 'إلغاء المشروع';

  @override
  String get cancelProjectConfirm => 'إلغاء هذا المشروع؟';

  @override
  String get cancelProjectMessage =>
      'سيتم رفض العروض المفتوحة. لا يمكن التراجع عن ذلك.';

  @override
  String get walletPending => 'قيد الانتظار';

  @override
  String get walletLocked => 'محجوز';

  @override
  String get txStatusPending => 'قيد الانتظار';

  @override
  String get txStatusHeld => 'محجوز';

  @override
  String get txStatusSucceeded => 'مكتملة';

  @override
  String get txStatusFailed => 'فشلت';

  @override
  String get txStatusReversed => 'مستردة';

  @override
  String get editProfile => 'تعديل الملف الشخصي';

  @override
  String get editProfileSaved => 'تم تحديث الملف الشخصي';

  @override
  String get cityLabel => 'المدينة';

  @override
  String get addressLabel => 'العنوان';

  @override
  String get bioLabel => 'نبذة عني';

  @override
  String get saveChanges => 'حفظ التغييرات';

  @override
  String get security => 'الأمان';

  @override
  String get changePassword => 'تغيير كلمة المرور';

  @override
  String get currentPassword => 'كلمة المرور الحالية';

  @override
  String get newPassword => 'كلمة المرور الجديدة';

  @override
  String get passwordChanged =>
      'تم تغيير كلمة المرور وتسجيل خروجك من الأجهزة الأخرى.';

  @override
  String get notificationPrefsTitle => 'تفضيلات الإشعارات';

  @override
  String get prefOrders => 'الطلبات والمهام';

  @override
  String get prefOrdersHint => 'تغيّر حالة طلباتك ومهامك';

  @override
  String get prefMessages => 'الرسائل';

  @override
  String get prefMessagesHint => 'الرسائل الجديدة من العملاء ومقدمي الخدمة';

  @override
  String get prefPromotions => 'العروض والتخفيضات';

  @override
  String get prefPromotionsHint => 'الخصومات وأخبار سهل';

  @override
  String get prefAccount => 'الحساب والأمان';

  @override
  String get prefAccountHint => 'تسجيلات الدخول والتوثيق وتغييرات الحساب';

  @override
  String get helpSupport => 'المساعدة والدعم';

  @override
  String get supportNewTicket => 'طلب دعم جديد';

  @override
  String get supportSubject => 'الموضوع';

  @override
  String get supportMessage => 'كيف يمكننا مساعدتك؟';

  @override
  String get supportSend => 'إرسال';

  @override
  String get supportEmpty => 'لا توجد طلبات دعم بعد. نحن هنا إن احتجت إلينا.';

  @override
  String get supportReplyHint => 'اكتب ردك…';

  @override
  String get supportClosedNote => 'تم إغلاق هذا الطلب.';

  @override
  String get ticketStatusOpen => 'مفتوح';

  @override
  String get ticketStatusInProgress => 'قيد المعالجة';

  @override
  String get ticketStatusResolved => 'تم الحل';

  @override
  String get ticketStatusClosed => 'مغلق';

  @override
  String get errorInvalidCurrentPassword => 'كلمة المرور الحالية غير صحيحة.';

  @override
  String get errorPasswordUnchanged => 'اختر كلمة مرور مختلفة عن الحالية.';

  @override
  String get errorAlreadyReviewed => 'لقد قيّمت هذه المهمة من قبل.';

  @override
  String get errorJobNotCompleted => 'يمكنك تقييم المهمة بعد اكتمالها.';

  @override
  String get errorTicketClosed => 'طلب الدعم هذا مغلق.';

  @override
  String get errorProjectNotOpen => 'هذا المشروع لم يعد مفتوحاً.';

  @override
  String get validationDescriptionTooShort =>
      'أضف تفاصيل أكثر قليلاً (5 أحرف على الأقل).';

  @override
  String get bookingScheduleInPast => 'اختر وقتاً في المستقبل.';

  @override
  String get openSettings => 'فتح الإعدادات';

  @override
  String get contractStatusInProgress => 'قيد التنفيذ';

  @override
  String get contractStatusCompleted => 'مكتمل';

  @override
  String get contractStatusDisputed => 'في نزاع';

  @override
  String get contractTotal => 'إجمالي العقد';

  @override
  String get viewContract => 'عرض العقد';

  @override
  String get projectBudget => 'الميزانية';

  @override
  String get txTypeDeposit => 'إيداع';

  @override
  String get txTypeWithdrawal => 'سحب';

  @override
  String get txTypeTransfer => 'تحويل';

  @override
  String get txTypeEscrowHold => 'مبلغ محجوز';

  @override
  String get txTypeEscrowRelease => 'تحرير مبلغ';

  @override
  String get txTypeRefund => 'استرداد';

  @override
  String get txTypeCommission => 'عمولة';

  @override
  String get txTypeBonus => 'مكافأة';

  @override
  String get txTypeCashback => 'استرداد نقدي';

  @override
  String get txTypeReward => 'جائزة';

  @override
  String get txTypeAdjustment => 'تسوية';

  @override
  String get txTypePenalty => 'غرامة';

  @override
  String get txTypePromotion => 'عرض ترويجي';

  @override
  String get txTypeTax => 'ضريبة';

  @override
  String get txTypeProcessingFee => 'رسوم معالجة';

  @override
  String get walletFrozen => 'محفظتك مجمّدة. تواصل مع الدعم للمساعدة.';
}
