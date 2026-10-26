// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUserRegistry {
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
        );
}

contract StudyMaterial {
    struct FileRecord {
        string title;
        string ipfsHash;
        address uploader;
    }

    FileRecord[] private files;
    address public immutable userRegistry;
    bool public immutable requireRegisteredUsers;

    event FileUploaded(
        uint256 indexed index,
        address indexed uploader,
        string title,
        string ipfsHash
    );

    error InvalidRegistryAddress();
    error RegistrationRequired(address uploader);
    error EmptyTitle();
    error EmptyCid();
    error LocalhostOnly();

    constructor(address registryAddress, bool requireRegisteredUploads) {
        if (registryAddress == address(0)) {
            revert InvalidRegistryAddress();
        }

        userRegistry = registryAddress;
        requireRegisteredUsers = requireRegisteredUploads;
    }

    function uploadFile(string calldata title, string calldata cid) external {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(cid).length == 0) revert EmptyCid();

        if (requireRegisteredUsers) {
            (, , , , bool isRegistered) = IUserRegistry(userRegistry).getUser(
                msg.sender
            );
            if (!isRegistered) {
                revert RegistrationRequired(msg.sender);
            }
        }

        files.push(
            FileRecord({title: title, ipfsHash: cid, uploader: msg.sender})
        );

        emit FileUploaded(files.length - 1, msg.sender, title, cid);
    }

    function getFilesCount() external view returns (uint256) {
        return files.length;
    }

    function getFile(
        uint256 index
    ) external view returns (string memory title, string memory ipfsHash, address uploader) {
        FileRecord storage fileRecord = files[index];
        return (fileRecord.title, fileRecord.ipfsHash, fileRecord.uploader);
    }

    function resetFiles() external {
        if (block.chainid != 31337) {
            revert LocalhostOnly();
        }

        delete files;
    }
}
