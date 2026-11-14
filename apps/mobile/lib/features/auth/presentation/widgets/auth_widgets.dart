import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/l10n/locale_controller.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

/// Brand palette for the onboarding/auth screens (dark with orange glow),
/// derived from AppColors so the brand orange stays a single source.
abstract final class AuthPalette {
  static const background = Color(0xFF0B0B0C);
  static const surface = Color(0xFF17171A);
  static const border = Color(0xFF2B2B30);
  static const textPrimary = Color(0xFFF5F5F5);
  static const textSecondary = Color(0xFFB4B4BA);
  static const orangeLight = Color(0xFFFF9A1F);
  static const orange = AppColors.primary;
  static const orangeDeep = Color(0xFFFF5A00);

  static const buttonGradient = LinearGradient(colors: [orangeLight, orangeDeep]);

  static const welcomeImage = 'assets/images/welcome.png';
}

/// Auth screens always render in the brand's dark style, whatever the
/// app-wide theme mode is.
class AuthTheme extends ConsumerWidget {
  const AuthTheme({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final base = AppTheme.dark(ref.watch(localeControllerProvider));
    return Theme(
      data: base.copyWith(
        scaffoldBackgroundColor: AuthPalette.background,
        colorScheme: base.colorScheme.copyWith(primary: AuthPalette.orange, surface: AuthPalette.background),
        textSelectionTheme: const TextSelectionThemeData(cursorColor: AuthPalette.orange),
      ),
      child: child,
    );
  }
}

/// Dark backdrop with the soft orange sweeps from the brand artwork.
class AuthBackground extends StatelessWidget {
  const AuthBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AuthPalette.background),
      child: Stack(
        children: [
          const Positioned.fill(child: CustomPaint(painter: _SweepPainter())),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

class _SweepPainter extends CustomPainter {
  const _SweepPainter();

  @override
  void paint(Canvas canvas, Size size) {
    void sweep(Path path, Rect bounds, List<Color> colors, Alignment begin, Alignment end) {
      final paint = Paint()..shader = LinearGradient(colors: colors, begin: begin, end: end).createShader(bounds);
      canvas.drawPath(path, paint);
    }

    final w = size.width, h = size.height;

    // Top corner swoosh.
    final top = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.42, 0)
      ..quadraticBezierTo(w * 0.30, h * 0.07, w * 0.10, h * 0.10)
      ..quadraticBezierTo(w * 0.02, h * 0.115, 0, h * 0.14)
      ..close();
    sweep(top, Rect.fromLTWH(0, 0, w * 0.42, h * 0.14),
        [AuthPalette.orangeLight, AuthPalette.orangeDeep.withValues(alpha: 0.85)], Alignment.topLeft, Alignment.bottomRight);

    final topGlow = Path()
      ..moveTo(w * 0.42, 0)
      ..lineTo(w * 0.62, 0)
      ..quadraticBezierTo(w * 0.40, h * 0.10, 0, h * 0.17)
      ..lineTo(0, h * 0.14)
      ..quadraticBezierTo(w * 0.28, h * 0.09, w * 0.42, 0)
      ..close();
    sweep(topGlow, Rect.fromLTWH(0, 0, w * 0.62, h * 0.17),
        [AuthPalette.orange.withValues(alpha: 0.35), AuthPalette.orange.withValues(alpha: 0.0)],
        Alignment.topRight, Alignment.bottomLeft);

    // Bottom corner swoosh.
    final bottom = Path()
      ..moveTo(w, h)
      ..lineTo(w * 0.55, h)
      ..quadraticBezierTo(w * 0.78, h * 0.93, w * 0.92, h * 0.90)
      ..quadraticBezierTo(w * 0.98, h * 0.885, w, h * 0.86)
      ..close();
    sweep(bottom, Rect.fromLTWH(w * 0.55, h * 0.86, w * 0.45, h * 0.14),
        [AuthPalette.orangeDeep.withValues(alpha: 0.9), AuthPalette.orangeLight], Alignment.bottomLeft, Alignment.topRight);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// The brand "S" mark, rendered with the button gradient.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 72});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (rect) => const LinearGradient(
        colors: [AuthPalette.orangeLight, AuthPalette.orangeDeep],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ).createShader(rect),
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.skewX(-0.2),
        child: Text(
          'S',
          textDirection: TextDirection.ltr,
          style: TextStyle(fontSize: size, height: 1, fontWeight: FontWeight.w900, color: Colors.white),
        ),
      ),
    );
  }
}

/// Full-width pill button with the brand gradient and a trailing chevron.
class GradientButton extends StatelessWidget {
  const GradientButton({super.key, required this.label, required this.onPressed, this.isLoading = false, this.showChevron = true});

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !isLoading;
    return Opacity(
      opacity: onPressed == null && !isLoading ? 0.5 : 1,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AuthPalette.buttonGradient,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(color: AuthPalette.orange.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 6)),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(30),
            onTap: enabled ? onPressed : null,
            child: SizedBox(
              height: 56,
              width: double.infinity,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (isLoading)
                    const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    )
                  else
                    Text(
                      label,
                      style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                  if (showChevron && !isLoading)
                    const PositionedDirectional(
                      end: 20,
                      child: Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 18),
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

/// Dark, rounded input with a leading icon — the field style from the design.
class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.controller,
    required this.hint,
    required this.icon,
    this.validator,
    this.keyboardType,
    this.textDirection,
    this.obscureText = false,
    this.suffix,
    this.enabled = true,
    this.textInputAction,
    this.onSubmitted,
    this.autofillHints,
  });

  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final TextDirection? textDirection;
  final bool obscureText;
  final Widget? suffix;
  final bool enabled;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: color, width: width),
        );

    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      textDirection: textDirection,
      obscureText: obscureText,
      enabled: enabled,
      textInputAction: textInputAction,
      onFieldSubmitted: onSubmitted,
      autofillHints: autofillHints,
      style: const TextStyle(color: AuthPalette.textPrimary, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AuthPalette.textSecondary, fontSize: 14),
        filled: true,
        fillColor: AuthPalette.surface,
        prefixIcon: Icon(icon, color: AuthPalette.textSecondary, size: 22),
        suffixIcon: suffix,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        border: border(AuthPalette.border),
        enabledBorder: border(AuthPalette.border),
        disabledBorder: border(AuthPalette.border),
        focusedBorder: border(AuthPalette.orange, 1.4),
        errorBorder: border(Theme.of(context).colorScheme.error),
        focusedErrorBorder: border(Theme.of(context).colorScheme.error, 1.4),
      ),
    );
  }
}

/// Password field with a show/hide toggle.
class AuthPasswordField extends StatefulWidget {
  const AuthPasswordField({
    super.key,
    required this.controller,
    required this.hint,
    required this.showLabel,
    required this.hideLabel,
    this.validator,
    this.enabled = true,
    this.textInputAction,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String hint;
  final String showLabel;
  final String hideLabel;
  final FormFieldValidator<String>? validator;
  final bool enabled;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  State<AuthPasswordField> createState() => _AuthPasswordFieldState();
}

class _AuthPasswordFieldState extends State<AuthPasswordField> {
  bool _obscured = true;

  @override
  Widget build(BuildContext context) {
    return AuthTextField(
      controller: widget.controller,
      hint: widget.hint,
      icon: Symbols.lock,
      obscureText: _obscured,
      validator: widget.validator,
      enabled: widget.enabled,
      textInputAction: widget.textInputAction,
      onSubmitted: widget.onSubmitted,
      autofillHints: const [AutofillHints.password],
      suffix: IconButton(
        tooltip: _obscured ? widget.showLabel : widget.hideLabel,
        icon: Icon(_obscured ? Symbols.visibility_off : Symbols.visibility, color: AuthPalette.textSecondary),
        onPressed: () => setState(() => _obscured = !_obscured),
      ),
    );
  }
}

/// Small rounded "back" button used at the top of auth steps.
class AuthBackButton extends StatelessWidget {
  const AuthBackButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: MaterialLocalizations.of(context).backButtonTooltip,
      onPressed: onPressed,
      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AuthPalette.textPrimary, size: 22),
    );
  }
}

/// Compact language toggle pill (ع / English).
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeControllerProvider);
    return OutlinedButton.icon(
      onPressed: () {
        final next = locale.languageCode == 'ar' ? const Locale('en') : const Locale('ar');
        ref.read(localeControllerProvider.notifier).setLocale(next);
      },
      style: OutlinedButton.styleFrom(
        foregroundColor: AuthPalette.textPrimary,
        side: const BorderSide(color: AuthPalette.border),
        backgroundColor: Colors.black.withValues(alpha: 0.35),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        // The app theme gives buttons a full-width minimum size; this pill hugs its content.
        minimumSize: const Size(0, 36),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
      icon: const Icon(Symbols.translate, size: 18),
      label: Text(label, style: const TextStyle(fontSize: 13)),
    );
  }
}
