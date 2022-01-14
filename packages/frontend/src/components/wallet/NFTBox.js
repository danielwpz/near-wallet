import React from 'react';
import styled from 'styled-components';

import { EXPLORER_URL } from '../../config';
import FailedToLoad from '../../images/failed_to_load.svg';
import isDataURL from '../../utils/isDataURL';
import DefaultTokenIcon from '../svg/DefaultTokenIcon';
import LoadMoreButtonWrapper from './LoadMoreButtonWrapper';

const StyledContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    padding: 15px 14px;

    :first-of-type {
        padding: 0 14px 15px 14px;
    }

    @media (max-width: 767px) {
        margin: 0 -14px;
    }

    @media (min-width: 992px) {
        padding: 15px 20px;

        :first-of-type {
            padding: 0 20px 15px 20px;
        }
    }

    .nft-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    .symbol {
        width: 33px;
        height: 33px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        img, svg {
            height: 32px;
            width: 32px;
        }
    }

    .desc {
        display: flex;
        align-items: center;
        margin-left: 14px;

        a {
            font-weight: 700;
            font-size: 16px;
            color: #24272a;
        }

        span {
            color: #72727A;
            background-color: #F0F0F1;
            font-size: 14px;
            font-weight: 600;
            min-width: 26px;
            min-height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 10px;
        }
    }

    .title {
        cursor: pointer;
    }

    .tokens {
        display: flex;
        flex-wrap: wrap;
        max-width: 100%;
    }

    .nft {
        flex-grow: 1;
        flex-basis: 50%;
        max-width: 50%;
        padding: 15px 0;
        color: black;

        :nth-child(odd) {
            padding-right: 5px;
        }

        :nth-child(even) {
            padding-left: 5px;
        }

        a {
            color: inherit; /* blue colors for links too */
        }
    }

    .creator {
        span {
            font-family: Inter;
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 150%;
            /* identical to box height, or 21px */
            
            
            /* gray/neutral/500 */
            
            color: #A2A2A8;
        }
    }

    .nft img {
        width: 100%;
        margin-bottom: 10px;
        cursor: pointer;
    }
`;

const NFTBox = ({ tokenDetails, history }) => {
    const {
        contractName,
        contractMetadata: { icon, name },
        ownedTokensMetadata,
        numberByContractName
    } = tokenDetails;


    return (
        <StyledContainer className='nft-box'>
            <div className='nft-header'>
                <div className='symbol'>
                    {icon && isDataURL(icon) ?
                        <img src={icon} alt={name} />
                        :
                        <DefaultTokenIcon />
                    }
                </div>
                <div className='desc'>
                    <a href={`${EXPLORER_URL}/accounts/${contractName}`} title={name} target='_blank'
                        rel='noopener noreferrer'>
                        {name}
                    </a>
                    <span>{numberByContractName}</span>
                </div>
            </div>
            {
                ownedTokensMetadata &&
                <div className='tokens'>
                    {ownedTokensMetadata.map(({ token_id, metadata }) => {
                        const { mediaUrl, title } = metadata;

                        return <div className='nft' key={token_id}>
                            <img src={mediaUrl} 
                                alt='NFT' 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FailedToLoad;
                                }} 
                                onClick={() => history.push(`/nft-detail/${contractName}/${token_id}`)}/>
                            <b className='title' onClick={() => history.push(`/nft-detail/${contractName}/${token_id}`)}>{title}</b>
                        </div>;
                    })}
                </div>
            }
            <LoadMoreButtonWrapper contractName={contractName} />
        </StyledContainer>
    );
};

export default NFTBox;
