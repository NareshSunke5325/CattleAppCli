export type RootStackParamList = {
  Dashboard: undefined;
  Livestock: undefined;
  Yards: undefined;
  Rosters: undefined;
  Orders: undefined;
  Notifications: undefined;
  Login: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}