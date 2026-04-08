export const agentProposalKeys = {
    all: ['agent-proposals'] as const,
    myProposals: (page: number, size: number) => [...agentProposalKeys.all, 'my-proposals', page, size] as const,
};
