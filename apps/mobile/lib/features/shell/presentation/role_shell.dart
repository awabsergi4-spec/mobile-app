import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// One bottom-navigation tab of a role shell.
class ShellDestination {
  const ShellDestination({required this.icon, required this.selectedIcon, required this.label});

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

/// Bottom-navigation frame shared by the Customer, Provider and Company
/// shells. Each tab is a GoRouter branch with its own navigation stack
/// (`StatefulShellRoute.indexedStack`), so switching tabs keeps scroll
/// position and pushed pages. Tapping the active tab returns to its root.
class RoleShell extends StatelessWidget {
  const RoleShell({super.key, required this.navigationShell, required this.destinations});

  final StatefulNavigationShell navigationShell;
  final List<ShellDestination> destinations;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Theme.of(context).dividerTheme.color ?? Colors.transparent)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (index) => navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          ),
          destinations: [
            for (final d in destinations)
              NavigationDestination(icon: Icon(d.icon), selectedIcon: Icon(d.selectedIcon), label: d.label),
          ],
        ),
      ),
    );
  }
}
