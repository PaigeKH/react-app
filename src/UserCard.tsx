import { Button } from 'primereact/button';

interface UserCardProps {
    user: any;
    onClick: (user: any) => void;
}

export default function UserCard({user, onClick}: UserCardProps)  {
    const selectUser = () => {
        onClick(user);
    }

  return (
    <div style={{display: 'flex', flexDirection: 'column', background: 'var(--primary-700)'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{flex: 1}}>
        {user.username}
        </div>
        <Button label='Fight' onClick={selectUser} id={user.username} value={user.username}></Button>
        </div>
    </div>
  );
};

