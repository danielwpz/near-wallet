import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountId, selectBalance } from '../redux/slices/account';
import { selectNearTokenFiatValueUSD } from '../redux/slices/tokenFiatValues';
import { selectTokensWithMetadataForAccountId } from '../redux/slices/tokens';

const fungibleTokensIncludingNEAR = (tokens, balance, nearTokenFiatValueUSD) => {
    return [
        {
            balance,
            symbol: 'NEAR',
            usd: nearTokenFiatValueUSD
        },
        ...Object.values(tokens)
    ];
};

export const useFungibleTokensIncludingNEAR = function () {
    const balance = useSelector((state) => selectBalance(state));
    const accountId = useSelector(state => selectAccountId(state));
    const tokens = useSelector(state => selectTokensWithMetadataForAccountId(state, { accountId }));
    const nearTokenFiatValueUSD = useSelector((state) => selectNearTokenFiatValueUSD(state));

    const balanceToDisplay = balance?.balanceAvailable;
    const [fungibleTokensList, setFungibleTokensList] = useState(
        () => fungibleTokensIncludingNEAR(tokens, balanceToDisplay)
    );

    useEffect(() => {
        setFungibleTokensList(fungibleTokensIncludingNEAR(tokens, balanceToDisplay, nearTokenFiatValueUSD));
    }, [tokens, balanceToDisplay]);

    return fungibleTokensList;
};