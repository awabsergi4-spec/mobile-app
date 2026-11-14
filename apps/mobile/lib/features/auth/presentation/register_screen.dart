import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/l10n/locale_controller.dart';
import '../../../core/utils/result.dart';
import '../../../shared/utils/validators.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/auth_controller.dart';
import '../domain/account_type.dart';
import 'widgets/auth_widgets.dart';

enum _Step { chooseType, details, pendingApproval }

/// Sign-up in three steps: account type → details → "waiting for approval".
/// There is no OTP: an administrator approves the account from the Admin
/// Platform, after which the user can log in.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _orgNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  _Step _step = _Step.chooseType;
  AccountType _accountType = AccountType.customer;
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    for (final c in [
      _fullNameController,
      _orgNameController,
      _phoneController,
      _emailController,
      _passwordController,
      _confirmController,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _back() {
    if (_step == _Step.details) {
      setState(() {
        _step = _Step.chooseType;
        _failure = null;
      });
    } else if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final orgName = _orgNameController.text.trim();
    final result = await ref.read(authControllerProvider.notifier).register(
          phone: _phoneController.text.trim(),
          password: _passwordController.text,
          fullName: _fullNameController.text.trim(),
          preferredLanguage: ref.read(localeControllerProvider).languageCode,
          accountType: _accountType,
          email: _emailController.text.trim(),
          businessName: _accountType == AccountType.provider ? orgName : null,
          companyName: _accountType == AccountType.company ? orgName : null,
        );

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      if (result is Failure<void>) {
        _failure = result.failure;
      } else {
        _step = _Step.pendingApproval;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return AuthTheme(
      child: PopScope(
        canPop: _step == _Step.chooseType,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop && _step == _Step.details) _back();
          if (!didPop && _step == _Step.pendingApproval) context.go('/login');
        },
        child: Scaffold(
          body: AuthBackground(
            child: SafeArea(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(animation),
                    child: child,
                  ),
                ),
                child: switch (_step) {
                  _Step.chooseType => _buildChooseType(l10n),
                  _Step.details => _buildDetails(l10n),
                  _Step.pendingApproval => _buildPending(l10n),
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _header(AppLocalizations l10n, {required String title, required String subtitle, bool showBack = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 48,
          child: Row(
            children: [
              if (showBack) AuthBackButton(onPressed: _back),
              const Spacer(),
              LanguageToggle(label: l10n.switchLanguage),
            ],
          ),
        ),
        const SizedBox(height: 8),
        const Center(child: BrandMark(size: 76)),
        const SizedBox(height: 18),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 26, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 15),
        ),
      ],
    );
  }

  Widget _buildChooseType(AppLocalizations l10n) {
    final options = [
      (AccountType.customer, Symbols.person, l10n.accountTypeCustomer, l10n.accountTypeCustomerHint),
      (AccountType.provider, Symbols.engineering, l10n.accountTypeProvider, l10n.accountTypeProviderHint),
      (AccountType.company, Symbols.apartment, l10n.accountTypeCompany, l10n.accountTypeCompanyHint),
    ];

    return SingleChildScrollView(
      key: const ValueKey('choose'),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header(l10n, title: l10n.registerChooseTitle, subtitle: l10n.registerChooseSubtitle),
          const SizedBox(height: 28),
          for (final (type, icon, title, hint) in options) ...[
            _AccountTypeCard(
              icon: icon,
              title: title,
              hint: hint,
              selected: _accountType == type,
              onTap: () => setState(() => _accountType = type),
            ),
            const SizedBox(height: 14),
          ],
          const SizedBox(height: 14),
          GradientButton(
            label: l10n.continueAction,
            onPressed: () => setState(() => _step = _Step.details),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.alreadyHaveAccount, style: const TextStyle(color: AuthPalette.textSecondary)),
              TextButton(
                onPressed: () => context.pushReplacement('/login'),
                style: TextButton.styleFrom(foregroundColor: AuthPalette.orange),
                child: Text(l10n.login, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetails(AppLocalizations l10n) {
    final title = switch (_accountType) {
      AccountType.customer => l10n.registerDetailsTitleCustomer,
      AccountType.provider => l10n.registerDetailsTitleProvider,
      AccountType.company => l10n.registerDetailsTitleCompany,
    };
    final orgLabel = switch (_accountType) {
      AccountType.provider => l10n.businessName,
      AccountType.company => l10n.companyName,
      AccountType.customer => null,
    };

    return SingleChildScrollView(
      key: const ValueKey('details'),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _header(l10n, title: title, subtitle: l10n.registerDetailsSubtitle),
              const SizedBox(height: 26),
              AuthTextField(
                controller: _fullNameController,
                hint: l10n.fullName,
                icon: Symbols.person,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.name],
                enabled: !_isSubmitting,
                validator: (value) => Validators.fullName(value, l10n),
              ),
              if (orgLabel != null) ...[
                const SizedBox(height: 12),
                AuthTextField(
                  controller: _orgNameController,
                  hint: orgLabel,
                  icon: _accountType == AccountType.company ? Symbols.apartment : Symbols.storefront,
                  textInputAction: TextInputAction.next,
                  enabled: !_isSubmitting,
                  validator: (value) => (value?.trim().length ?? 0) < 2 ? l10n.validationRequired : null,
                ),
              ],
              const SizedBox(height: 12),
              AuthTextField(
                controller: _phoneController,
                hint: l10n.phoneNumber,
                icon: Symbols.call,
                keyboardType: TextInputType.phone,
                textDirection: TextDirection.ltr,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                enabled: !_isSubmitting,
                validator: (value) => Validators.phone(value, l10n),
              ),
              const SizedBox(height: 12),
              AuthTextField(
                controller: _emailController,
                hint: l10n.emailOptional,
                icon: Symbols.mail,
                keyboardType: TextInputType.emailAddress,
                textDirection: TextDirection.ltr,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                enabled: !_isSubmitting,
                validator: (value) => Validators.optionalEmail(value, l10n),
              ),
              const SizedBox(height: 12),
              AuthPasswordField(
                controller: _passwordController,
                hint: l10n.password,
                showLabel: l10n.showPassword,
                hideLabel: l10n.hidePassword,
                textInputAction: TextInputAction.next,
                enabled: !_isSubmitting,
                validator: (value) => Validators.password(value, l10n),
              ),
              const SizedBox(height: 12),
              AuthPasswordField(
                controller: _confirmController,
                hint: l10n.confirmPassword,
                showLabel: l10n.showPassword,
                hideLabel: l10n.hidePassword,
                textInputAction: TextInputAction.done,
                enabled: !_isSubmitting,
                onSubmitted: (_) => _submit(),
                validator: (value) => Validators.confirmPassword(value, _passwordController.text, l10n),
              ),
              if (_failure != null) ...[
                const SizedBox(height: 14),
                ErrorBanner(message: localizeFailure(l10n, _failure!)),
              ],
              const SizedBox(height: 24),
              GradientButton(label: l10n.register, onPressed: _submit, isLoading: _isSubmitting),
              const SizedBox(height: 14),
              Text(
                l10n.termsNotice,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPending(AppLocalizations l10n) {
    return Padding(
      key: const ValueKey('pending'),
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Spacer(),
          const Center(child: _SuccessBadge()),
          const SizedBox(height: 36),
          Text(
            l10n.registerSuccessTitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 26, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.registerPendingBody,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AuthPalette.orangeLight, fontSize: 16, height: 1.6),
          ),
          const Spacer(flex: 2),
          GradientButton(label: l10n.backToLogin, onPressed: () => context.go('/login')),
        ],
      ),
    );
  }
}

class _AccountTypeCard extends StatelessWidget {
  const _AccountTypeCard({
    required this.icon,
    required this.title,
    required this.hint,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String hint;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: selected ? AuthPalette.orange.withValues(alpha: 0.10) : AuthPalette.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: selected ? AuthPalette.orange : AuthPalette.border, width: selected ? 1.6 : 1),
            ),
            child: Row(
              children: [
                Container(
                  height: 58,
                  width: 58,
                  decoration: BoxDecoration(
                    gradient: selected ? AuthPalette.buttonGradient : null,
                    color: selected ? null : AuthPalette.border,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: Colors.white, size: 30, fill: 1),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(hint, style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
                Icon(
                  selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: selected ? AuthPalette.orange : AuthPalette.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SuccessBadge extends StatelessWidget {
  const _SuccessBadge();

  @override
  Widget build(BuildContext context) {
    const confetti = [
      (Alignment(-0.95, -0.7), 0.6), (Alignment(0.9, -0.85), -0.4), (Alignment(-0.75, 0.85), 0.3),
      (Alignment(0.95, 0.55), -0.7), (Alignment(0.05, -1.05), 0.9), (Alignment(-1.05, 0.1), -0.2),
    ];
    return SizedBox(
      height: 200,
      width: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (final (alignment, angle) in confetti)
            Align(
              alignment: alignment,
              child: Transform.rotate(
                angle: angle,
                child: Container(
                  height: 12,
                  width: 6,
                  decoration: BoxDecoration(color: AuthPalette.orange, borderRadius: BorderRadius.circular(2)),
                ),
              ),
            ),
          Container(
            height: 150,
            width: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [AuthPalette.orangeLight, AuthPalette.orangeDeep],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [BoxShadow(color: AuthPalette.orange.withValues(alpha: 0.5), blurRadius: 40)],
              border: Border.all(color: Colors.white.withValues(alpha: 0.18), width: 6),
            ),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 86),
          ),
        ],
      ),
    );
  }
}
