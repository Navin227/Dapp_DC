// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    struct UserProfile {
        string name;
        string email;
        string department;
        string year;
        bool isRegistered;
    }

    mapping(address => UserProfile) private users;
    mapping(bytes32 => address) private emailOwners;
    address[] private registeredAddresses;
    bytes32[] private registeredEmailHashes;

    event UserRegistered(
        address indexed user,
        string name,
        string email,
        string department,
        string year
    );

    error UserAlreadyRegistered(address user);
    error EmailAlreadyRegistered(string email);
    error InvalidProfileField(string fieldName);
    error LocalhostOnly();

    function _normalizeEmail(
        string memory email
    ) private pure returns (bytes32 emailHash) {
        return keccak256(bytes(email));
    }

    function registerUser(
        string calldata name,
        string calldata email,
        string calldata department,
        string calldata year
    ) external {
        if (users[msg.sender].isRegistered) {
            revert UserAlreadyRegistered(msg.sender);
        }
        if (bytes(name).length == 0) revert InvalidProfileField("name");
        if (bytes(email).length == 0) revert InvalidProfileField("email");
        if (bytes(department).length == 0) revert InvalidProfileField("department");
        if (bytes(year).length == 0) revert InvalidProfileField("year");
        if (emailOwners[_normalizeEmail(email)] != address(0)) {
            revert EmailAlreadyRegistered(email);
        }

        users[msg.sender] = UserProfile({
            name: name,
            email: email,
            department: department,
            year: year,
            isRegistered: true
        });
        bytes32 normalizedEmail = _normalizeEmail(email);
        emailOwners[normalizedEmail] = msg.sender;
        registeredAddresses.push(msg.sender);
        registeredEmailHashes.push(normalizedEmail);

        emit UserRegistered(msg.sender, name, email, department, year);
    }

    function resetRegistry() external {
        if (block.chainid != 31337) {
            revert LocalhostOnly();
        }

        for (uint256 index = 0; index < registeredAddresses.length; index++) {
            delete users[registeredAddresses[index]];
        }

        for (uint256 index = 0; index < registeredEmailHashes.length; index++) {
            delete emailOwners[registeredEmailHashes[index]];
        }

        delete registeredAddresses;
        delete registeredEmailHashes;
    }

    function getUser(
        address userAddress
    )
        external
        view
        returns (
            string memory name,
            string memory email,
            string memory department,
            string memory year,
            bool isRegistered
        )
    {
        UserProfile storage user = users[userAddress];
        return (
            user.name,
            user.email,
            user.department,
            user.year,
            user.isRegistered
        );
    }

    function getUserByEmail(
        string calldata email
    )
        external
        view
        returns (
            string memory name,
            string memory registeredEmail,
            string memory department,
            string memory year,
            bool isRegistered
        )
    {
        address owner = emailOwners[_normalizeEmail(email)];
        UserProfile storage user = users[owner];
        return (
            user.name,
            user.email,
            user.department,
            user.year,
            user.isRegistered
        );
    }

    function getUserWalletByEmail(
        string calldata email
    ) external view returns (address) {
        return emailOwners[_normalizeEmail(email)];
    }

    function isEmailRegistered(
        string calldata email
    ) external view returns (bool) {
        return emailOwners[_normalizeEmail(email)] != address(0);
    }
}
