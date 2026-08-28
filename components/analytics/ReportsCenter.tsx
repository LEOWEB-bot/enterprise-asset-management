import React from 'react';
import { Asset, AssetCategory, User as UserType } from '../../types';
import { DepreciationFinancials } from './DepreciationFinancials';

interface ReportsCenterProps {
  assets: Asset[];
  categories: AssetCategory[];
  currentUser: UserType;
  isReadOnlyMode: boolean;
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({
  assets,
  categories,
}) => {
  return (
    <div className="animate-fadeIn">
      {/* Main Organic Spatial Financial Analytics & Depreciation Hub */}
      <DepreciationFinancials assets={assets} categories={categories} />
    </div>
  );
};
