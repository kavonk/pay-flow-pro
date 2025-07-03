import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton height={16} width={100} />
          <Skeleton height={16} width={20} />
        </CardHeader>
        <CardContent>
          <Skeleton height={24} width={80} />
          <Skeleton height={12} width={120} className="mt-1" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Chart Skeleton
export const ChartSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton height={20} width={150} />
    </CardHeader>
    <CardContent>
      <Skeleton height={300} />
    </CardContent>
  </Card>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="border rounded-md">
    <div className="border-b p-4">
      <div className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={16} width={100} />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b p-4 last:border-b-0">
        <div className="flex space-x-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} height={16} width={80 + Math.random() * 40} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton height={24} width={200} />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={16} width={100} />
          <Skeleton height={40} />
        </div>
      ))}
      <div className="flex justify-end space-x-2 pt-4">
        <Skeleton height={36} width={80} />
        <Skeleton height={36} width={80} />
      </div>
    </CardContent>
  </Card>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 border-b last:border-b-0">
    <Skeleton circle height={40} width={40} />
    <div className="flex-1 space-y-2">
      <Skeleton height={16} width={200} />
      <Skeleton height={12} width={150} />
    </div>
    <Skeleton height={32} width={80} />
  </div>
);

// Page Loading Skeleton
export const PageSkeleton: React.FC = () => (
  <div className="container mx-auto py-8 space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton height={32} width={200} />
      <Skeleton height={36} width={120} />
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton height={20} width={150} />
          </CardHeader>
          <CardContent>
            <Skeleton height={80} />
          </CardContent>
        </Card>
      ))}
    </div>
    <TableSkeleton rows={8} />
  </div>
);

// Settings Skeleton
export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton height={20} width={150} />
          <Skeleton height={12} width={250} className="mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center justify-between">
              <div>
                <Skeleton height={16} width={120} />
                <Skeleton height={12} width={200} className="mt-1" />
              </div>
              <Skeleton height={24} width={44} />
            </div>
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

// Invoice Detail Skeleton
export const InvoiceDetailSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton height={28} width={180} />
        <Skeleton height={16} width={120} />
      </div>
      <div className="flex space-x-2">
        <Skeleton height={36} width={80} />
        <Skeleton height={36} width={80} />
      </div>
    </div>
    
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton height={20} width={100} />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton height={16} width={80} />
              <Skeleton height={16} width={100} />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton height={20} width={120} />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton height={16} width={90} />
              <Skeleton height={16} width={110} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);