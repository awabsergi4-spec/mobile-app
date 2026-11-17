import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/provider_controller.dart';
import '../domain/provider_profile.dart';

class ProviderProfileScreen extends ConsumerWidget {
  const ProviderProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final profile = ref.watch(providerProfileControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.providerProfileTitle)),
      body: AsyncValueView<ProviderProfile>(
        value: profile,
        onRetry: () => ref.invalidate(providerProfileControllerProvider),
        data: (context, data) => _ProfileForm(profile: data),
      ),
    );
  }
}

class _ProfileForm extends ConsumerStatefulWidget {
  const _ProfileForm({required this.profile});

  final ProviderProfile profile;

  @override
  ConsumerState<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends ConsumerState<_ProfileForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _businessNameController;
  late final TextEditingController _bioController;
  late final TextEditingController _yearsController;
  late final TextEditingController _skillsController;
  late final TextEditingController _travelDistanceController;
  late final TextEditingController _emergencyContactNameController;
  late final TextEditingController _emergencyContactPhoneController;
  late bool _remoteAvailable;
  late bool _emergencyAvailable;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final profile = widget.profile;
    _businessNameController = TextEditingController(text: profile.businessName);
    _bioController = TextEditingController(text: profile.bio ?? '');
    _yearsController = TextEditingController(text: profile.yearsOfExperience?.toString() ?? '');
    _skillsController = TextEditingController(text: profile.skills.join(', '));
    _travelDistanceController = TextEditingController(text: profile.travelDistanceKm?.toString() ?? '');
    _emergencyContactNameController = TextEditingController(text: profile.emergencyContactName ?? '');
    _emergencyContactPhoneController = TextEditingController(text: profile.emergencyContactPhone ?? '');
    _remoteAvailable = profile.remoteAvailable;
    _emergencyAvailable = profile.emergencyAvailable;
  }

  @override
  void dispose() {
    _businessNameController.dispose();
    _bioController.dispose();
    _yearsController.dispose();
    _skillsController.dispose();
    _travelDistanceController.dispose();
    _emergencyContactNameController.dispose();
    _emergencyContactPhoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final skills = _skillsController.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();

    final result = await ref.read(providerProfileControllerProvider.notifier).updateProfile(
          businessName: _businessNameController.text.trim(),
          bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
          yearsOfExperience: int.tryParse(_yearsController.text.trim()),
          skills: skills,
          travelDistanceKm: double.tryParse(_travelDistanceController.text.trim()),
          remoteAvailable: _remoteAvailable,
          emergencyAvailable: _emergencyAvailable,
          emergencyContactName: _emergencyContactNameController.text.trim().isEmpty ? null : _emergencyContactNameController.text.trim(),
          emergencyContactPhone:
              _emergencyContactPhoneController.text.trim().isEmpty ? null : _emergencyContactPhoneController.text.trim(),
        );

    if (!mounted) return;
    result.when(
      success: (_) => setState(() => _isSubmitting = false),
      failure: (failure) => setState(() {
        _isSubmitting = false;
        _errorMessage = localizeFailure(l10n, failure);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _businessNameController,
              decoration: InputDecoration(labelText: l10n.providerBusinessName),
              enabled: !_isSubmitting,
              validator: (value) => (value == null || value.trim().length < 2) ? l10n.validationRequired : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _bioController,
              decoration: InputDecoration(labelText: l10n.providerBio),
              maxLines: 3,
              enabled: !_isSubmitting,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _yearsController,
              decoration: InputDecoration(labelText: l10n.providerYearsOfExperience),
              keyboardType: TextInputType.number,
              enabled: !_isSubmitting,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _skillsController,
              decoration: InputDecoration(labelText: l10n.providerSkills),
              enabled: !_isSubmitting,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _travelDistanceController,
              decoration: InputDecoration(labelText: l10n.providerTravelDistanceKm),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              enabled: !_isSubmitting,
            ),
            const SizedBox(height: AppSpacing.md),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.providerRemoteAvailable),
              value: _remoteAvailable,
              onChanged: _isSubmitting ? null : (value) => setState(() => _remoteAvailable = value),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.providerEmergencyAvailable),
              value: _emergencyAvailable,
              onChanged: _isSubmitting ? null : (value) => setState(() => _emergencyAvailable = value),
            ),
            if (_emergencyAvailable) ...[
              const SizedBox(height: AppSpacing.sm),
              TextFormField(
                controller: _emergencyContactNameController,
                decoration: InputDecoration(labelText: l10n.providerEmergencyContactName),
                enabled: !_isSubmitting,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _emergencyContactPhoneController,
                decoration: InputDecoration(labelText: l10n.providerEmergencyContactPhone),
                keyboardType: TextInputType.phone,
                enabled: !_isSubmitting,
              ),
            ],
            if (_errorMessage != null) ...[
              const SizedBox(height: AppSpacing.md),
              ErrorBanner(message: _errorMessage!),
            ],
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(l10n.providerSaveProfile),
            ),
          ],
        ),
      ),
    );
  }
}
