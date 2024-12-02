import React, { useState } from 'react';
import { VirtualScroller } from 'primereact/virtualscroller';
import { classNames } from 'primereact/utils';

export default function BasicDemo() {
    const [items] = useState(Array.from({ length: 100000 }).map((_, i) => `Item #${i}`));

    const itemTemplate = (item:any, options:any) => {

        return (
            <div style={{ height: options.props.itemSize + 'px' }}>
                {item}
            </div>
        );
    };

    return ( 
        <div className="card ">
            <VirtualScroller items={items} itemSize={50} itemTemplate={itemTemplate} style={{ width: '200px', height: '200px' }} />
        </div>
    );
}
         