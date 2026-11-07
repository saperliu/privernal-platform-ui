export function adapterOfFetchUserList(data: Api.UserManagement.User[] | null): Api.UserManagement.User[] {
  if (!data) return [];

  return data.map((item, index) => {
    const user: Api.UserManagement.User = {
      index: index + 1,
      ...item
    };

    return user;
  });
}
