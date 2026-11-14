import '../domain/current_user.dart';

enum AuthStatus {
  /// Not yet determined — before the first restoreSession() run.
  initial,

  /// Checking secure storage / calling GET /users/me on app start.
  restoring,
  unauthenticated,
  authenticated,
}

class AuthState {
  const AuthState({required this.status, this.user});

  const AuthState.initial() : this(status: AuthStatus.initial);

  final AuthStatus status;
  final CurrentUser? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  AuthState copyWith({AuthStatus? status, CurrentUser? user}) {
    return AuthState(status: status ?? this.status, user: user ?? this.user);
  }
}
