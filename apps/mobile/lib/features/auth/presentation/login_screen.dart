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
import '../application/auth_controller.dart';
import 'widgets/auth_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting) return; // no double-tap double-submits
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final result = await ref.read(authControllerProvider.notifier).login(
          phone: _phoneController.text.trim(),
          password: _passwordController.text,
        );

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      _failure = result is Failure<void> ? result.failure : null;
    });
    // On success GoRouter's redirect moves to /home by itself.
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final canPop = context.canPop();

    return AuthTheme(
      child: Scaffold(
        body: AuthBackground(
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Form(
                key: _formKey,
                child: AutofillGroup(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        height: 48,
                        child: Row(
                          children: [
                            if (canPop) AuthBackButton(onPressed: () => context.pop()),
                            const Spacer(),
                            LanguageToggle(label: l10n.switchLanguage),
                          ],
                        ),
                      ),
                      const _LoginHero(),
                      Text(
                        l10n.loginTitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        l10n.loginSubtitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 15),
                      ),
                      const SizedBox(height: 28),
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
                      const SizedBox(height: 14),
                      AuthPasswordField(
                        controller: _passwordController,
                        hint: l10n.password,
                        showLabel: l10n.showPassword,
                        hideLabel: l10n.hidePassword,
                        enabled: !_isSubmitting,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _submit(),
                        validator: (value) => Validators.required(value, l10n),
                      ),
                      Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: TextButton(
                          onPressed: _isSubmitting ? null : () => context.push('/forgot-password'),
                          style: TextButton.styleFrom(foregroundColor: AuthPalette.orange),
                          child: Text(l10n.forgotPassword, style: const TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ),
                      if (_failure != null) ...[
                        const SizedBox(height: 6),
                        ErrorBanner(message: localizeFailure(l10n, _failure!)),
                      ],
                      const SizedBox(height: 18),
                      GradientButton(label: l10n.login, onPressed: _submit, isLoading: _isSubmitting),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(l10n.dontHaveAccount, style: const TextStyle(color: AuthPalette.textSecondary)),
                          TextButton(
                            onPressed: _isSubmitting ? null : () => context.pushReplacement('/register'),
                            style: TextButton.styleFrom(foregroundColor: AuthPalette.orange),
                            child: Text(l10n.createAccountLink, style: const TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Upper part of the brand illustration, fading into the background.
class _LoginHero extends StatelessWidget {
  const _LoginHero();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 230,
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (rect) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white, Colors.white, Colors.transparent],
          stops: [0, 0.7, 1],
        ).createShader(rect),
        child: Image.asset(
          AuthPalette.welcomeImage,
          fit: BoxFit.cover,
          alignment: const Alignment(0, -0.55),
        ),
      ),
    );
  }
}
