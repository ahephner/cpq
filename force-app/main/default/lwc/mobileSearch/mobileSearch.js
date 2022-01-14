import { LightningElement, api, track } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';


export default class MobileSearch extends LightningElement {
    queryTerm;
    cat = 'All';  
    pf = 'All';
    priceBookId = '01s410000077vSKAAY'; 
    @track prod =[]; 
    @track items =[]; 
    loaded = false;
    showFam = false; 
    showFilters = false; 
    openFilters = false;
    connectedCallback(){
        this.loaded = true; 
    }
    //handle the search button click
    handleSearch(){
        var input = this.template.querySelector('lightning-input')
        this.queryTerm = input.value; 
        console.log(this.queryTerm)
        this.search();  
    }

    addFilters(){
        if(this.items){
            this.items = []
        }
       // this.template.querySelector('c-mobile-search-filters').openFilter();
       this.openFilters = true; 
    }
    closeFilter(){
        this.openFilters = false;
    }

    updateFilters(event){
        this.cat = event.detail.cat;
        let catLab = event.detail.catLab
        this.pf = event.detail.pf;  
        this.handlePills(catLab, this.pf);
    }
    handlePills(cat, pf){
        const catPill = cat !='All' ? {label:cat, name:'catPill'} : undefined;
        const pfPill = pf!= 'All' ? {label:pf, name:'familyPill'} : undefined;
        if(catPill && pfPill){
            this.items.push(catPill, pfPill);
        }else if(catPill  && !pfPill){
            this.items.push(catPill);
        }else if(!catPill && pfPill){
            this.items.push(pfPill);
        }else{
            this.items = [];
        }
        this.showFilters = true; 
    }
    removePill(pill){
        let type = pill.detail.item.name
        let index = pill.detail.index;
        this.items.splice(index, 1);
        if(type === 'catPill'){
            this.cat = 'All'
        }else{
            this.pf = 'All';
        }        
    }
    search(){
        this.loaded = false; 
        searchProduct({searchKey: this.queryTerm, cat: this.cat, family: this.pf, priceBookId:this.priceBookId})
            .then((results)=>{
                let Name;
                let ProductCode
                let icon;
                let title;
                let agency;
                let onhand; 
                this.prod = results.map(x =>{
                    Name = x.Product2.Name,
                    ProductCode = x.Product2.ProductCode,
                    agency = x.Agency_Product__c,
                    onhand = x.Product2.Total_Product_Items__c,
                    icon = 'action:new',
                    title = ''
                    return {...x, Name, ProductCode, icon, title, agency, onhand}
                })
                //this.prod = results; 
                console.log('search');
                
                console.log(JSON.stringify(this.prod))
                
            }).catch((error)=>{
                this.error = error;
                console.log('error -->'+error);
            }).finally(()=>{
                    this.loaded = true; 
                    
            })
    }
    //helper function finds selected product and changes button. 
    findProduct(sel){
        let index = this.prod.findIndex(item => item.Id === sel.target.name)
        
        if(this.prod[index].icon==='action:new'){
            this.prod[index].icon = 'action:approval'
            this.prod[index].title = 'added!'
            this.addProduct(this.prod[index]);
        }else{
            this.prod[index].icon = 'action:new'
            this.prod[index].title = ''
            this.removeProduct(this.prod[index])
        }
        return ;
    }
    addProduct(product){
        
        const pd = product;
        console.log(JSON.stringify(pd))
        this.dispatchEvent(new CustomEvent('newprod',{
            detail: pd
        }))
    }

    removeProduct(sProd){
        const removeCode = sProd.ProductCode;

        this.dispatchEvent(new CustomEvent('remove',{
            detail: removeCode
        }))
    }
    @api
    showResult(mess){
        console.log('mess ' +mess); 
    }
    handleDone(){
        console.log('dispatch');
        
        this.loaded = false;
        this.dispatchEvent(new CustomEvent('close'));
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}