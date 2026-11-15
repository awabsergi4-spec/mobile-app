import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/utils/result.dart';
import '../../../shared/utils/validators.dart';
import '../../../shared/widgets/error_banner.dart';
import '../data/password_reset_repository.dart';
import 'widgets/auth_widgets.dart';

/// Forgot password: (1) send a request with the phone number, (2) enter the
/// 6-digit code SAHL support sends, plus a new password.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _requestKey = GlobalKey<FormState>();
  final _confirmKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _codeStep = false;
  bool _busy = false;
  AppFailure? _failure;

  @override
  void dispose() {
    for (final c in [_phone, _code, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _request() async {
    if (_busy || !_requestKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _failure = null;
    });
    final result = await ref.read(passwordResetRepositoryProvider).request(_phone.text.trim());
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (result case Failure(:final failure)) {
        _failure = failure;
      } else {
        _codeStep = true;
      }
    });
  }

  Future<void> _confirmReset() async {
    if (_busy || !_confirmKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _failure = null;
    });
    final result = await ref.read(passwordResetRepositoryProvider).confirm(
          phone: _phone.text.trim(),
          code: _code.text.trim(),
          newPassword: _password.text,
        );
    if (!mounted) return;
    switch (result) {
      case Success():
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.resetDone)));
        context.pop();
      case Failure(:final failure):
        setState(() {
          _busy = false;
          _failure = failure;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final phoneField = AuthTextField(
      controller: _phone,
      hint: l10n.emailOrPhone,
      icon: Symbols.alternate_email,
      keyboardType: TextInputType.emailAddress,
      textDirection: TextDirection.ltr,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.email, AutofillHints.username, AutofillHints.telephoneNumber],
      enabled: !_busy,
      validator: (value) => Validators.emailOrPhone(value, l10n),
    );

    return AuthTheme(
      child: Scaffold(
        body: AuthBackground(
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: 48,
                    child: Row(
                      children: [
                        AuthBackButton(onPressed: () => _codeStep ? setState(() => _codeStep = false) : context.pop()),
                        const Spacer(),
                        LanguageToggle(label: l10n.switchLanguage),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Center(child: Icon(Symbols.lock_reset, size: 56, color: AuthPalette.orange)),
                  const SizedBox(height: 16),
                  Text(
                    _codeStep ? l10n.resetCodeTitle : l10n.resetTitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 26, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _codeStep ? l10n.resetRequestedMessage : l10n.resetRequestSubtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 15, height: 1.5),
                  ),
                  const SizedBox(height: 28),
                  if (!_codeStep)
                    Form(
                      key: _requestKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          phoneField,
                          if (_failure != null) ...[
                            const SizedBox(height: 14),
                            ErrorBanner(message: localizeFailure(l10n, _failure!)),
                          ],
                          const SizedBox(height: 24),
                          GradientButton(label: l10n.resetRequestButton, onPressed: _request, isLoading: _busy),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: _busy
                                ? null
                                : () {
                                    if (_requestKey.currentState!.validate()) setState(() => _codeStep = true);
                                  },
                            style: TextButton.styleFrom(foregroundColor: AuthPalette.orange),
                            child: Text(l10n.resetHaveCode, style: const TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    )
                  else
                    Form(
                      key: _confirmKey,
                      child: AutofillGroup(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            AuthTextField(
                              controller: _code,
                              hint: l10n.resetCodeLabel,
                              icon: Symbols.pin,
                              keyboardType: TextInputType.number,
                              textDirection: TextDirection.ltr,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.oneTimeCode],
                              enabled: !_busy,
                              validator: (v) => RegExp(r'^\d{6}$').hasMatch(v?.trim() ?? '') ? null : l10n.validationResetCode,
                            ),
                            const SizedBox(height: 14),
                            AuthPasswordField(
                              controller: _password,
                              hint: l10n.newPassword,
                              showLabel: l10n.showPassword,
                              hideLabel: l10n.hidePassword,
                              enabled: !_busy,
                              textInputAction: TextInputAction.next,
                              validator: (v) => Validators.password(v, l10n),
                            ),
                            const SizedBox(height: 14),
                            AuthPasswordField(
                              controller: _confirm,
                              hint: l10n.resetConfirmPassword,
                              showLabel: l10n.showPassword,
                              hideLabel: l10n.hidePassword,
                              enabled: !_busy,
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _confirmReset(),
                              validator: (v) => Validators.confirmPassword(v, _password.text, l10n),
                            ),
                            if (_failure != null) ...[
                              const SizedBox(height: 14),
                              ErrorBanner(message: localizeFailure(l10n, _failure!)),
                            ],
                            const SizedBox(height: 24),
                            GradientButton(label: l10n.resetSubmit, onPressed: _confirmReset, isLoading: _busy),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
