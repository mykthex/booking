export const membershipResolvers = {
    Membership: {
        id: async (parent, _args) => {
            return parent.id || null;
        },
        name: async (parent, _args) => {
            return parent.name || null;
        },
        cost: async (parent, _args) => {
            return parent.cost || null;
        },
    },
};
