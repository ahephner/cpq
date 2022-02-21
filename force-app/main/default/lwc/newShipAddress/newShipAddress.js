import { LightningElement, api } from 'lwc';
import OBJ from '@salesforce/schema/ContactPointAddress';
import NAME from '@salesforce/schema/ContactPointAddress.Name';
import PARENT from '@salesforce/schema/ContactPointAddress.ParentId';
import TYPE from '@salesforce/schema/ContactPointAddress.AddressType';
import STREET from '@salesforce/schema/ContactPointAddress.Street';
import CITY from '@salesforce/schema/ContactPointAddress.City';
import STATE from '@salesforce/schema/ContactPointAddress.State';
import ZIP from '@salesforce/schema/ContactPointAddress.PostalCode';


export default class NewShipAddress extends LightningElement{
        @api accId
        showAddress=false;
        contactPointAddress = OBJ; 
        name = NAME;
        type = TYPE; 
        parent = PARENT; 
        street = STREET;
        state = STATE;
        city = CITY;
        zip = ZIP;
        @api
        openAddress(){
            this.showAddress = true;
            this.parent = this.accId;  
        }

        closeModal(){
            this.showAddress = false; 
        }

        handleNewAddress(){
            this.showAddress = false; 
        }
}