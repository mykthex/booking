export const roleResolvers = {
    Role: {
        name: async (parent, _args) => {
            return parent.role || null;
        },
    },
};
