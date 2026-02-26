export function createUserSchema(data) {
  return {
    _id: data._id,
    name: data.name,
    email: data.email?.toLowerCase(),
    role: data.role, // super_admin | admin | customer
    phone: data.phone || '',
    department: data.department || '',
    createdAt: data.createdAt || new Date(),
  }
}
