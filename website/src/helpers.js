export function sortList(list, sortBy, direction = 1) {
  const sortedList = list.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return -direction;
    }
    if (a[sortBy] > b[sortBy]) {
      return direction;
    }
    return 0;
  });
  return sortedList;
}
