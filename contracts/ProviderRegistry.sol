// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProviderRegistry
 * @dev Manages compute provider registration and metadata
 */
contract ProviderRegistry is Ownable {
    
    struct Provider {
        address owner;
        string metadataURI;
        bool isActive;
        uint256 registeredAt;
        uint256 hourlyRate; // in USDC units (6 decimals)
    }
    
    mapping(address => Provider) public providers;
    address[] public providerList;
    
    event ProviderRegistered(
        address indexed owner, 
        string metadataURI, 
        uint256 hourlyRate,
        uint256 registeredAt
    );
    
    event ProviderUpdated(
        address indexed owner, 
        string metadataURI, 
        bool isActive,
        uint256 hourlyRate
    );
    
    event ProviderStatusChanged(address indexed owner, bool isActive);
    
    modifier onlyProvider() {
        require(providers[msg.sender].owner == msg.sender, "Not a registered provider");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register as a new compute provider
     * @param metadataURI IPFS/0G Storage URI with provider details (specs, location, etc.)
     * @param hourlyRate Rate in USDC units per hour
     */
    function registerProvider(string calldata metadataURI, uint256 hourlyRate) external {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(hourlyRate > 0, "Rate must be greater than 0");
        require(providers[msg.sender].owner == address(0), "Provider already registered");
        
        providers[msg.sender] = Provider({
            owner: msg.sender,
            metadataURI: metadataURI,
            isActive: true,
            registeredAt: block.timestamp,
            hourlyRate: hourlyRate
        });
        
        providerList.push(msg.sender);
        
        emit ProviderRegistered(msg.sender, metadataURI, hourlyRate, block.timestamp);
    }
    
    /**
     * @dev Update provider metadata and rate
     */
    function updateProvider(string calldata metadataURI, uint256 hourlyRate) external onlyProvider {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(hourlyRate > 0, "Rate must be greater than 0");
        
        Provider storage provider = providers[msg.sender];
        provider.metadataURI = metadataURI;
        provider.hourlyRate = hourlyRate;
        
        emit ProviderUpdated(msg.sender, metadataURI, provider.isActive, hourlyRate);
    }
    
    /**
     * @dev Toggle provider active status
     */
    function updateProviderStatus(bool isActive) external onlyProvider {
        providers[msg.sender].isActive = isActive;
        emit ProviderStatusChanged(msg.sender, isActive);
    }
    
    /**
     * @dev Get provider details
     */
    function getProvider(address owner) external view returns (Provider memory) {
        return providers[owner];
    }
    
    /**
     * @dev Check if address is a registered and active provider
     */
    function isActiveProvider(address owner) external view returns (bool) {
        return providers[owner].isActive && providers[owner].owner != address(0);
    }
    
    /**
     * @dev Get total number of registered providers
     */
    function getProviderCount() external view returns (uint256) {
        return providerList.length;
    }
    
    /**
     * @dev Get list of all providers (paginated)
     */
    function getProviders(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 end = offset + limit;
        if (end > providerList.length) {
            end = providerList.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = providerList[i];
        }
        
        return result;
    }
}
