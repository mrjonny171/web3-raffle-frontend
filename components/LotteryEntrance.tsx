import { useWeb3Contract } from 'react-moralis'
import { contractAddresses, abi } from '../constants'
import { useMoralis } from 'react-moralis'
import { BigNumber, ethers, ContractTransaction } from 'ethers'
import { useEffect, useState } from 'react'
import { useNotification } from 'web3uikit'

interface contractAddressesInterface {
    [key: string]: string[]
}

export default function LotteryEntrance() {
    const addresses: contractAddressesInterface = contractAddresses

    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId: string = parseInt(chainIdHex!).toString()
    const raffleAddress = chainId in addresses ? addresses[chainId][0] : null

    const [entranceFee, setEntranceFee] = useState('0')
    const [numPlayers, setNumPlayers] = useState('0')
    const [recentWinner, setRecentWinner] = useState('0')

    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: 'enterRaffle',
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: 'getEntranceFee',
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: 'getNumberOfPlayers',
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: 'getRecentWinner',
        params: {},
    })

    async function updateUI() {
        const entranceFeeFromCall = ((await getEntranceFee()) as BigNumber).toString()
        const numOfPlayersFromCall = ((await getNumberOfPlayers()) as BigNumber).toString()
        const recentWinnerfromCall = (await getRecentWinner()) as string

        setRecentWinner(recentWinnerfromCall)
        setNumPlayers(numOfPlayersFromCall)
        setEntranceFee(entranceFeeFromCall)
    }

    const handleSucess = async function (tx: ContractTransaction) {
        await tx.wait(1)
        handleNewNotification()
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: 'info',
            message: 'Transaction Complete!',
            title: 'Transaction Notification',
            position: 'topR',
        })
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    return (
        <div className="p-5">
            Hi from lottery entrance!
            {raffleAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterRaffle({
                                onSuccess: (tx) => {
                                    handleSucess(tx as ContractTransaction)
                                },
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>

                    <div>Entrance Fee: {ethers.utils.formatUnits(entranceFee, 'ether')} ETH</div>
                    <div>Recent winner : {recentWinner}</div>
                    <div>Number of players: {numPlayers}</div>
                </div>
            ) : (
                <div> No raffle address detected! </div>
            )}
        </div>
    )
}
