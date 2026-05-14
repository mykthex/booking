export const bookingResolvers = {
    Booking: {
        player1: async (parent, _args, context) => {
            if (!parent.player1)
                return null;
            const user = await context.userLoader.load(parent.player1);
            return `${user?.name} ${user?.surname}` || null;
        },
        player2: async (parent, _args, context) => {
            if (!parent.player2)
                return null;
            const user = await context.userLoader.load(parent.player2);
            return `${user?.name} ${user?.surname}` || null;
        },
        player1Id: async (parent) => {
            return parent.player1 || null;
        },
        player2Id: async (parent) => {
            return parent.player2 || null;
        },
        courtName: async (parent, _args, context) => {
            if (!parent.courtId)
                return null;
            const court = await context.courtLoader.load(parent.courtId);
            return court?.name || null;
        },
        paid: async (parent) => {
            return Boolean(parent.paid || false);
        },
    },
};
