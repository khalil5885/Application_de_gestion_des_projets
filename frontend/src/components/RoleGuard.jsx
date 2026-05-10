const RoleGuard = ({ children, allowedRoles, userRole }) => {
  if (!allowedRoles.includes(userRole)) {
    return null; // Don't render anything if the role doesn't match
  }
  return <>{children}</>;
};

export default RoleGuard;