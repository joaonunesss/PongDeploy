// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TournamentScore {

    // Estrutura para armazenar as informações do torneio
    struct Tournament {
        uint256 id; // Id do torneio
        string tournamentName;
        string winner; // Vencedor do torneio
        string[] players; // Jogadores do Torneio
    }

    // Mapeamento de IDs de torneio para os detalhes
    // mapeia IDs do torneio para a estrutura dele
    mapping(uint256 => Tournament) public tournaments;

    // Evento para emitir quando um novo resultado é registrado
    // event TournamentResultStored(uint256 indexed tournamentId, string tournamentName, string winner);

    // Função para registrar os resultados de um torneio
    function storeResult(uint256 _tournamentId,
                         string memory _tournamentName,
                         string memory _winner,
                         string[] memory _players) public {
        // Garantir que o ID do torneio seja único
        require(tournaments[_tournamentId].id == 0, "Tournament already registered");

        // Armazenar os detalhes do torneio
        tournaments[_tournamentId] = Tournament(_tournamentId, _tournamentName, _winner, _players);

        // Emitir o evento
        // emit TournamentResultStored(_tournamentId, _tournamentName, _winner);
    }

    // Função para recuperar os detalhes de um torneio
    function getTournamentResult(uint256 _tournamentId) public view returns (uint256 id, string memory winner, string memory tournamentName, string[] memory players) {
        require(tournaments[_tournamentId].id != 0, "Tournament not found");

        Tournament memory tournament = tournaments[_tournamentId];
        return (tournament.id, tournament.tournamentName, tournament.winner, tournament.players);
    }
}

/*
    Code explained:

        "// S*PDX-License-Identifier: MIT"

            This is a license identifier. Part of the
        SPDX license.

            This indicates that the contract is licensed
        under the MIT License, a permissive open-source
        license.

            Including an SPDX license is the best practice
        in Solidity contracts.

            Many tools like truffle, that we use, check
        if this line exists and might issue wornings if
        it's missing.


        "pragma solidity ^0.8.0;"

        Specifies the version of the Solidity compiler.

        "pragma" is a directive that provides compiler
    instructions or checks.

        "solidity" specifies that this pragma applies to
    Solidity.

        "0.8.0" the contract is compatible with version
    0.8.0


        Continuing with the contract:

        1º -> "contract TournamentScore":

            This line declares a contract named TournamentScore.

            A contract in Solidity is similar to a class
        in C++. It is the main building block for Ethereum
        applications.

            It contains the data (state variables) and
        functions that define the behavior of the smart
        contratc.


        2º -> "struct Tournament":

            Here we define a struct.

            In the struct we define the follow properties:

            uint256 id; -> Represents the unique ID of the
        tournament.

            string tournamentName; -> Store the name of
        the tournament.

            string winner; -> Holds the name of the
        winner of the tournament.

            string[] players; -> List of players that
        participate in the tournament.


        3º -> "mapping(uint256 => Tournament) public tournaments;":

            What is a mapping in Solidity?

            It is a key-value store, similar to a dictionary
        in Python or a map in C++.

            In this map, the type of the key is uint256, and
        the type of the value is the type Tournament, wich is
        the struct defined earlier.

            The words "public tournaments":

            Declares the name of the mapping as tournaments,
        and the "public" keyword automatically generetes a
        getter function for the mapping, enabling external
        access to retrieve tournament data.

            The genereted getter allows users (or other contracts)
        to access a tournament by its ID, like this:

            Tournament memory t = tournaments[1];


            The purpose of the mapping is to store all
        tournaments in the contract, indexed by their
        unique ID (uint256).
            It acts as a database where each tournament
        can be looked up.


        4º -> "event TournamentResultStored(uint 256 indexed
         tournamentId, string winner, string tournamentName);":

            What is an event in Solidity?

                Events in Solidity are a way for a smart
            contract to communicate with external applications,
            like front-end apps, logging information to the
            blockchain.

                When an event is emitted, it creates a log entry
            on the Ethereum blockchain that can be accessed
            using transaction receipts or queried using Ethereum
            tools like Web3.js(That we will be using).

            The structure of this event:

                "event TournamentResultStored" -> This declares
            the event named TournamentResultStored.
                It serves as a log entry that gets triggered
            when certain actions (like storing tournament
            results) occur in the contract.

                "uint256 indexed tournamentId" -> The uint256
            represents the ID of the tournament.

                "indexed" Marks this parameter as an indexed topic.
            Indexed parameters allow filtering logs efficiently by
            their values, making it easier to search for specific
            events in the blockchain.
                This makes it possible to filter events by tournamentId.

                "string winner" -> Stores the name of the tournament
            winner.

                "string tournamentName" -> Stores the name of the
            tournament.

            This event will be emitted when the result of a
        tournament is stored in the contract.

            How this is used?:

                1. Logging: When the event is emitted, it creates
            a log entry in the transaction receipt, providing an
            immutable record of the action.

                2. Front-End Integration: External apps can
            listen for this event using Web3.js. Example:

            contractInstance.events.TournamentResultStored({
                filter: { tournamentId: 1},
                fromBlock: 0
            }, (error, event) => {
                if (!error) {
                    console.log(event.returnValues);
                }
            });

                3. Analytics and Auditing: The event log can be
            used to track and verify tournament results without
            directly interacting with the contract's storage.


        5º -> Next we have our first function declaration.

            Function header -> function storeResult.

            This declares a public function named "storeResult".
            This function can be called both externally and
        internally.

            The parameters:

                Basically the parameters of our Tournament
            struct.

            Function Logic:

                1.: Input Validation!!

                require(tournaments[_tournamentId].id == 0,
            "Tournament already registered");

                This ensures that the tournamentId is unique.

                It checks whether the "id" field of the
            tournament stored in the "tournaments" mapping
            for the given _tournamentId is 0(The default value
            for uint256). If a tournament with the same ID
            already exists, the function reverts with the error
            message.

                2.: Storing Tournament Details!!

                tournaments[_tournamentId] = Tournament(_tournamentId,
                 _winner, _tournamentName, _players);

                Here, a new Tournament struct is created using the
            input parameters. The struct is then stored in the
            "tournaments" mapping at the key "_tournamentId".

                3.: Emitting the Event!!

                emit TournamentResultStored(_tournamentId,
                _winner, _tournamentName);

                Here we trigger the TournamentResultStored event,
            logging the parameters on the blockchain.

                This step provides a transparent record of the
            action and makes it easier for external tools to
            track updates.

                WE MIGHT USE THE "onlyOwner" KEYWORD TO RESTRICT
            ACCESS TO THIS FUNCTION.


        6º -> The Second function!!!

            Function Header -> function getTournamentResult

            This function retrieves details about a specific
        tournament based on its ID.

            The parameters: Only the ID of the tournament
        to be retrieved. Passed as an input to look up the
        corresponding Tournament in the tournaments mapping.

            It's visibility is public!

            It has a state modifier "VIEW".
            This specifies that the function does not modify
        the contract's state. It only reads from it.

            We have then the return values, wich are the
        parameters of our struct "Tournament".

            Function Logic:

                1.: Input Validation:

                require(tournaments[_tournamentId].id != 0,
            "Tournament not found");

                This line ensures the tournament with the
            given ID exists!

                2.: Retrieve Tournament Data:

                Tournament memory tournament = tournaments[_tournamentId];

                Fetches the Tournament struct corresponding
            to the given ID from the tournaments mapping.
                Stores the struct in a local variable "tournament"
            in memory.

                The "memory" keyword refers to temporary memory
            that is not persistent. It will only exist during the
            execution of the function.

                3.: Return Tournament Details:

                After that it return the four filds from the
            fetched Tournament.


*/
