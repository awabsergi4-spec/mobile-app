import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import 'widgets/auth_widgets.dart';

/// Onboarding: the brand illustration with three swipeable messages.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _pageController = PageController();
  Timer? _autoAdvance;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _autoAdvance = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_pageController.hasClients) return;
      final next = (_page + 1) % 3;
      _pageController.animateToPage(next, duration: const Duration(milliseconds: 450), curve: Curves.easeOutCubic);
    });
  }

  @override
  void dispose() {
    _autoAdvance?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final slides = [
      (l10n.onboardingTitle1, l10n.onboardingHighlight1, l10n.onboardingBody1),
      (l10n.onboardingTitle2, l10n.onboardingHighlight2, l10n.onboardingBody2),
      (l10n.onboardingTitle3, l10n.onboardingHighlight3, l10n.onboardingBody3),
    ];

    return AuthTheme(
      child: Scaffold(
        body: AuthBackground(
          child: SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(20, 8, 20, 0),
                  child: Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: LanguageToggle(label: l10n.switchLanguage),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Image.asset(AuthPalette.welcomeImage, fit: BoxFit.contain),
                  ),
                ),
                SizedBox(
                  height: 150,
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: slides.length,
                    onPageChanged: (index) => setState(() => _page = index),
                    itemBuilder: (context, index) {
                      final (title, highlight, body) = slides[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 28),
                        child: Column(
                          children: [
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AuthPalette.textPrimary,
                                fontSize: 30,
                                fontWeight: FontWeight.w800,
                                height: 1.2,
                              ),
                            ),
                            Text(
                              highlight,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AuthPalette.orange,
                                fontSize: 30,
                                fontWeight: FontWeight.w800,
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              body,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              style: const TextStyle(color: AuthPalette.textSecondary, fontSize: 15, height: 1.5),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                _PageDots(count: slides.length, index: _page),
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 22, 28, 4),
                  child: GradientButton(label: l10n.getStarted, onPressed: () => context.push('/register')),
                ),
                TextButton(
                  onPressed: () => context.push('/login'),
                  style: TextButton.styleFrom(foregroundColor: AuthPalette.textSecondary),
                  child: Text.rich(
                    TextSpan(
                      text: '${l10n.alreadyHaveAccountLogin} · ',
                      children: [
                        TextSpan(
                          text: l10n.login,
                          style: const TextStyle(color: AuthPalette.orange, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    style: const TextStyle(fontSize: 15),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            height: 8,
            width: i == index ? 26 : 8,
            decoration: BoxDecoration(
              color: i == index ? AuthPalette.orange : AuthPalette.border,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
      ],
    );
  }
}
