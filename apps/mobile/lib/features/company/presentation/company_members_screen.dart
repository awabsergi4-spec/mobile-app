import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/company_members_controller.dart';
import '../application/company_sent_invitations_controller.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';
import '../domain/company_role.dart';
import 'widgets/company_role_label.dart';

class CompanyMembersScreen extends ConsumerWidget {
  const CompanyMembersScreen({super.key, required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final members = ref.watch(companyMembersControllerProvider(companyId));
    final invitations = ref.watch(companySentInvitationsControllerProvider(companyId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.companyMembersTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showInviteSheet(context, companyId),
        icon: const Icon(Icons.person_add_alt),
        label: Text(l10n.companyInviteMember),
      ),
      body: AsyncValueView<List<CompanyMember>>(
        value: members,
        onRetry: () => ref.invalidate(companyMembersControllerProvider(companyId)),
        data: (context, memberList) {
          final pendingInvitations = invitations.valueOrNull?.where((i) => i.status == CompanyInvitationStatus.pending).toList() ?? [];

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(companyMembersControllerProvider(companyId));
              ref.invalidate(companySentInvitationsControllerProvider(companyId));
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.base),
              children: [
                if (memberList.isEmpty)
                  EmptyStateView(message: l10n.companyNoMembers)
                else
                  ...memberList.map((member) => _MemberTile(companyId: companyId, member: member)),
                const SizedBox(height: AppSpacing.xl),
                Text(l10n.companyPendingInvitations, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                if (pendingInvitations.isEmpty)
                  EmptyStateView(message: l10n.companyNoPendingInvitations)
                else
                  ...pendingInvitations.map((invitation) => _InvitationTile(companyId: companyId, invitation: invitation)),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showInviteSheet(BuildContext context, String companyId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.xl,
          right: AppSpacing.xl,
          top: AppSpacing.xl,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
        ),
        child: _InviteMemberForm(companyId: companyId),
      ),
    );
  }
}

class _MemberTile extends ConsumerWidget {
  const _MemberTile({required this.companyId, required this.member});

  final String companyId;
  final CompanyMember member;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final isOwner = member.role == CompanyRole.owner;

    return Card(
      child: ListTile(
        title: Text(member.userId),
        subtitle: Text(companyRoleText(l10n, member.role)),
        trailing: isOwner
            ? null
            : PopupMenuButton<CompanyRole>(
                onSelected: (role) {
                  if (role == member.role) return;
                  ref.read(companyMembersControllerProvider(companyId).notifier).updateRole(member.id, role);
                },
                itemBuilder: (context) => [
                  CheckedPopupMenuItem(checked: member.role == CompanyRole.manager, value: CompanyRole.manager, child: Text(l10n.companyRoleManager)),
                  CheckedPopupMenuItem(checked: member.role == CompanyRole.staff, value: CompanyRole.staff, child: Text(l10n.companyRoleStaff)),
                  PopupMenuItem(
                    onTap: () => ref.read(companyMembersControllerProvider(companyId).notifier).remove(member.id),
                    child: Text(l10n.companyRemoveMember),
                  ),
                ],
              ),
      ),
    );
  }
}

class _InvitationTile extends ConsumerWidget {
  const _InvitationTile({required this.companyId, required this.invitation});

  final String companyId;
  final CompanyInvitation invitation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    return Card(
      child: ListTile(
        title: Text(invitation.invitedPhone),
        subtitle: Text(companyRoleText(l10n, invitation.role)),
        trailing: TextButton(
          onPressed: () => ref.read(companySentInvitationsControllerProvider(companyId).notifier).cancel(invitation.id),
          child: Text(l10n.companyCancelInvitation),
        ),
      ),
    );
  }
}

class _InviteMemberForm extends ConsumerStatefulWidget {
  const _InviteMemberForm({required this.companyId});

  final String companyId;

  @override
  ConsumerState<_InviteMemberForm> createState() => _InviteMemberFormState();
}

class _InviteMemberFormState extends ConsumerState<_InviteMemberForm> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  CompanyRole _role = CompanyRole.staff;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref
        .read(companyMembersControllerProvider(widget.companyId).notifier)
        .invite(invitedPhone: _phoneController.text.trim(), role: _role);

    if (!mounted) return;
    result.when(
      success: (_) {
        ref.invalidate(companySentInvitationsControllerProvider(widget.companyId));
        Navigator.of(context).pop();
      },
      failure: (failure) => setState(() {
        _isSubmitting = false;
        _errorMessage = localizeFailure(l10n, failure);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _phoneController,
            decoration: InputDecoration(labelText: l10n.companyInvitedPhone),
            keyboardType: TextInputType.phone,
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().length < 8) ? l10n.validationPhoneInvalid : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<CompanyRole>(
            initialValue: _role,
            decoration: InputDecoration(labelText: l10n.companyRole),
            items: [
              DropdownMenuItem(value: CompanyRole.manager, child: Text(l10n.companyRoleManager)),
              DropdownMenuItem(value: CompanyRole.staff, child: Text(l10n.companyRoleStaff)),
            ],
            onChanged: _isSubmitting ? null : (value) => setState(() => _role = value ?? CompanyRole.staff),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ErrorBanner(message: _errorMessage!),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.companySendInvite),
          ),
        ],
      ),
    );
  }
}
