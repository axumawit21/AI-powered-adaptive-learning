export function getStudentId() {
  let studentId = localStorage.getItem('studentId');
  if (!studentId) {
    studentId = crypto.randomUUID();
    localStorage.setItem('studentId', studentId);
  }
  return studentId;
}
