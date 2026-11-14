import 'package:flutter/animation.dart';

/// Animation durations from docs/00-ui-ux-design-system.md §Animations.
/// Pair with [curve] — a single shared "smooth" easing per the spec,
/// avoiding both linear motion and bouncy curves that would read as
/// playful rather than professional/confident.
abstract final class AppMotion {
  static const short = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 250);
  static const complex = Duration(milliseconds: 350);

  static const curve = Curves.easeInOutCubic;
}
