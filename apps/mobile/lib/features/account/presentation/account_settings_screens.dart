import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/result.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../application/account_providers.dart';
import '../domain/account_models.dart';
import 'widgets/profile_photo_editor.dart';

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// Edit name, email, city, address and bio (`PATCH /users/me`).
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _user = ref.read(authControllerProvider).user;
  late final _name = TextEditingController(text: _user?.fullName ?? '');
  late final _email = TextEditingController(text: _user?.email ?? '');
  late final _city = TextEditingController(text: _user?.city ?? '');
  late final _address = TextEditingController(text: _user?.address ?? '');
  late final _bio = TextEditingController(text: _user?.bio ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _email, _city, _address, _bio]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _saving = true;
      _error = null;
    });
    final result = await ref.read(accountRepositoryProvider).updateProfile(
          fullName: _name.text.trim(),
          email: _email.text.trim(),
          city: _city.text.trim(),
          address: _address.text.trim(),
          bio: _bio.text.trim(),
        );
    if (!mounted) return;
    switch (result) {
      case Success():
        await ref.read(authControllerProvider.notifier).refreshCurrentUser();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.editProfileSaved)));
        context.pop();
      case Failure(:final failure):
        setState(() {
          _saving = false;
          _error = localizeFailure(l10n, failure);
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.editProfile)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            const Center(child: ProfilePhotoEditor(size: 96)),
            const SizedBox(height: AppSpacing.lg),
            TextFormField(
              controller: _name,
              enabled: !_saving,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.fullName, prefixIcon: const Icon(Symbols.person)),
              validator: (v) => (v?.trim().length ?? 0) < 2 ? l10n.validationFullNameTooShort : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _email,
              enabled: !_saving,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.emailOptional, prefixIcon: const Icon(Symbols.mail)),
              validator: (v) {
                final text = v?.trim() ?? '';
                return text.isEmpty || _emailPattern.hasMatch(text) ? null : l10n.validationEmailInvalid;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _city,
              enabled: !_saving,
              maxLength: 120,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.cityLabel, prefixIcon: const Icon(Symbols.location_city)),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _address,
              enabled: !_saving,
              maxLength: 300,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.addressLabel, prefixIcon: const Icon(Symbols.home_pin)),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _bio,
              enabled: !_saving,
              minLines: 3,
              maxLines: 6,
              maxLength: 1000,
              decoration: InputDecoration(labelText: l10n.bioLabel, alignLabelWithHint: true),
            ),
            if (_error != null) ...[const SizedBox(height: AppSpacing.sm), ErrorBanner(message: _error!)],
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(AppSpacing.base),
        child: FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(l10n.saveChanges),
        ),
      ),
    );
  }
}

/// Change password (`POST /users/me/password`): signs out other devices.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _saving = true;
      _error = null;
    });
    final result = await ref.read(accountRepositoryProvider).changePassword(currentPassword: _current.text, newPassword: _new.text);
    if (!mounted) return;
    switch (result) {
      case Success():
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.passwordChanged)));
        context.pop();
      case Failure(:final failure):
        setState(() {
          _saving = false;
          _error = localizeFailure(l10n, failure);
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final toggle = IconButton(
      tooltip: l10n.changePassword,
      icon: Icon(_obscure ? Symbols.visibility : Symbols.visibility_off),
      onPressed: () => setState(() => _obscure = !_obscure),
    );
    return Scaffold(
      appBar: AppBar(title: Text(l10n.changePassword)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            TextFormField(
              controller: _current,
              enabled: !_saving,
              obscureText: _obscure,
              decoration: InputDecoration(labelText: l10n.currentPassword, prefixIcon: const Icon(Symbols.lock), suffixIcon: toggle),
              validator: (v) => (v ?? '').isEmpty ? l10n.validationRequired : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _new,
              enabled: !_saving,
              obscureText: _obscure,
              decoration: InputDecoration(labelText: l10n.newPassword, prefixIcon: const Icon(Symbols.key)),
              validator: (v) => (v ?? '').length < 8 ? l10n.validationPasswordTooShort : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _confirm,
              enabled: !_saving,
              obscureText: _obscure,
              decoration: InputDecoration(labelText: l10n.confirmPassword, prefixIcon: const Icon(Symbols.key)),
              validator: (v) => v != _new.text ? l10n.validationPasswordsDontMatch : null,
            ),
            if (_error != null) ...[const SizedBox(height: AppSpacing.md), ErrorBanner(message: _error!)],
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(AppSpacing.base),
        child: FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(l10n.changePassword),
        ),
      ),
    );
  }
}

/// Per-category notification switches; each toggle saves immediately.
class NotificationPrefsScreen extends ConsumerStatefulWidget {
  const NotificationPrefsScreen({super.key});

  @override
  ConsumerState<NotificationPrefsScreen> createState() => _NotificationPrefsScreenState();
}

class _NotificationPrefsScreenState extends ConsumerState<NotificationPrefsScreen> {
  NotificationPrefs? _local;
  bool _saving = false;

  Future<void> _update(NotificationPrefs previous, NotificationPrefs next) async {
    if (_saving) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _local = next;
      _saving = true;
    });
    final result = await ref.read(accountRepositoryProvider).saveNotificationPrefs(next);
    if (!mounted) return;
    setState(() => _saving = false);
    if (result case Failure(:final failure)) {
      setState(() => _local = previous); // roll back the switch
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final prefs = ref.watch(notificationPrefsProvider);
    final tokens = context.sahl;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.notificationPrefsTitle)),
      body: AsyncValueView<NotificationPrefs>(
        value: prefs,
        loading: const SkeletonList(itemCount: 4),
        onRetry: () => ref.invalidate(notificationPrefsProvider),
        data: (context, loaded) {
          final p = _local ?? loaded;
          Widget tile(IconData icon, Color color, String title, String hint, bool value, NotificationPrefs Function(bool) apply) =>
              SwitchListTile(
                secondary: IconBadge(icon: icon, color: color, size: 40),
                title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(hint),
                value: value,
                onChanged: _saving ? null : (v) => _update(p, apply(v)),
              );
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.base),
            children: [
              SahlCard(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                child: Column(
                  children: [
                    tile(Symbols.receipt_long, Theme.of(context).colorScheme.primary, l10n.prefOrders, l10n.prefOrdersHint, p.orders,
                        (v) => p.copyWith(orders: v)),
                    tile(Symbols.chat, tokens.info, l10n.prefMessages, l10n.prefMessagesHint, p.messages, (v) => p.copyWith(messages: v)),
                    tile(Symbols.sell, tokens.accent, l10n.prefPromotions, l10n.prefPromotionsHint, p.promotions,
                        (v) => p.copyWith(promotions: v)),
                    tile(Symbols.shield_person, tokens.success, l10n.prefAccount, l10n.prefAccountHint, p.account,
                        (v) => p.copyWith(account: v)),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

(String, StatusTone) ticketStatusLabel(AppLocalizations l10n, TicketStatus s) => switch (s) {
      TicketStatus.open => (l10n.ticketStatusOpen, StatusTone.info),
      TicketStatus.inProgress => (l10n.ticketStatusInProgress, StatusTone.warning),
      TicketStatus.resolved => (l10n.ticketStatusResolved, StatusTone.success),
      TicketStatus.closed => (l10n.ticketStatusClosed, StatusTone.neutral),
    };
