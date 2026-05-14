export const pageResolvers = {
    Page: {
        title: async (parent, _args) => {
            return parent.meta.title || null;
        },
        description: async (parent, _args) => {
            return parent.meta.description || null;
        },
        image: async (parent, _args) => {
            return parent.meta.image || null;
        },
    },
};
