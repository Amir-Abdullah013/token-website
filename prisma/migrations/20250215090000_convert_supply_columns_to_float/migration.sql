-- Allow decimal values for token supply and reserve tracking
ALTER TABLE token_supply
  ALTER COLUMN "totalSupply" TYPE DOUBLE PRECISION USING "totalSupply"::double precision,
  ALTER COLUMN "remainingSupply" TYPE DOUBLE PRECISION USING "remainingSupply"::double precision,
  ALTER COLUMN "userSupplyRemaining" TYPE DOUBLE PRECISION USING "userSupplyRemaining"::double precision,
  ALTER COLUMN "adminReserve" TYPE DOUBLE PRECISION USING "adminReserve"::double precision;

ALTER TABLE admin_supply_transfers
  ALTER COLUMN amount TYPE DOUBLE PRECISION USING amount::double precision,
  ALTER COLUMN "fromReserve" TYPE DOUBLE PRECISION USING "fromReserve"::double precision,
  ALTER COLUMN "toUserSupply" TYPE DOUBLE PRECISION USING "toUserSupply"::double precision;

ALTER TABLE token_minting
  ALTER COLUMN amount TYPE DOUBLE PRECISION USING amount::double precision,
  ALTER COLUMN "totalSupply" TYPE DOUBLE PRECISION USING "totalSupply"::double precision,
  ALTER COLUMN "remainingSupply" TYPE DOUBLE PRECISION USING "remainingSupply"::double precision;

ALTER TABLE mint_history
  ALTER COLUMN amount TYPE DOUBLE PRECISION USING amount::double precision;

