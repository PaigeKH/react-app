import { useAuth0 } from "@auth0/auth0-react";
import { Menubar } from "primereact/menubar";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();
  const { logout, loginWithRedirect, isAuthenticated, user } = useAuth0();

const onPress = (event: any) => {
   navigate('/' + event.item.id);
  }

const onPressLogout = () => {
    logout({ logoutParams: {returnTo: window.location.origin}});
}

const onPressLogin = () => {
    loginWithRedirect();
}

return (
    isAuthenticated && user ?   
    <Menubar style={{minWidth: '100vw', position: 'fixed', top: 0, left: 0}} model={[
        {label: 'Home', command:onPress, id:''},
        {label: 'Scroll', command:onPress, id:'scroll'},
        {label: 'Party', command:onPress, id:'party'},
        {label: 'Battle', id:'battleSelect', items: [
            {
                label: 'Async',
                id: 'battle',
                command:onPress,
            },
            {
                label: 'Sync',
                id: 'battleSync',
            }
    ]},
        {label: 'Logout', command:onPressLogout, id:'logout'}
    ]}
    end={
        isAuthenticated && user && <div>
            {'User: ' + user.name}
        </div>
    }/> : 
    <Menubar style={{minWidth: '100vw', position: 'fixed', top: 0, left: 0}} model={[
        {label: 'Home', command:onPress, id:''},
        {label: 'Login', command:onPressLogin, id:'login'},
    ]}/>
);
};

export default TopBar;